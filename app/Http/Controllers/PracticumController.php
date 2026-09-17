<?php

namespace App\Http\Controllers;

use App\Models\AccomplishmentReport;
use App\Models\Attendance;
use App\Models\Evaluation;
use App\Models\Feedback;
use App\Models\Journal;
use App\Models\Placement;
use App\Models\Requirement;
use App\Models\Task;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class PracticumController extends Controller
{
    /**
     * Get IDs of all students assigned to a supervisor's department or directly to the supervisor.
     */
    public static function getSupervisorStudentIds(User $supervisor): Collection
    {
        $supervisorDept = trim($supervisor->department ?? '');

        return Placement::where(function ($q) use ($supervisor, $supervisorDept) {
            $q->where('supervisor_id', $supervisor->id);

            if (! empty($supervisor->email)) {
                $q->orWhere('supervisor_email', $supervisor->email);
            }
            if (! empty($supervisor->name)) {
                $q->orWhere('supervisor_name', $supervisor->name);
            }
            if (! empty($supervisorDept)) {
                $q->orWhere('company_name', $supervisorDept)
                    ->orWhere('department', $supervisorDept)
                    ->orWhereRaw('LOWER(company_name) = ?', [strtolower($supervisorDept)])
                    ->orWhereRaw('LOWER(department) = ?', [strtolower($supervisorDept)]);

                // Match core department name / keyword (e.g. "MIS", "Registrar", "Library")
                $cleanDept = preg_replace('/\s*\(.*?\)/', '', $supervisorDept);
                $parts = array_filter(array_map('trim', explode('/', $cleanDept)));
                foreach ($parts as $part) {
                    if (strlen($part) >= 3) {
                        $q->orWhere('company_name', 'like', '%'.$part.'%')
                            ->orWhere('department', 'like', '%'.$part.'%');
                    }
                }
            }
        })->pluck('student_id')->unique()->values();
    }

    public function getState(Request $request)
    {
        $user = Auth::user();
        if (! $user) {
            return response()->json(['error' => 'Unauthenticated'], 401);
        }

        if ($user->role === 'student') {
            return response()->json($this->getStudentState($user));
        } elseif ($user->role === 'supervisor') {
            return response()->json($this->getSupervisorState($user));
        } elseif ($user->role === 'adviser') {
            return response()->json($this->getAdviserState($user));
        } elseif ($user->role === 'admin') {
            return response()->json($this->getAdminState($user));
        }

        return response()->json([]);
    }

    private function calculateGradeEquiv($rating)
    {
        $r = (float) $rating;
        if ($r >= 97) {
            return '1.00 (Outstanding / Excellent)';
        }
        if ($r >= 94) {
            return '1.25 (Very Superior)';
        }
        if ($r >= 91) {
            return '1.50 (Superior)';
        }
        if ($r >= 88) {
            return '1.75 (Very Good)';
        }
        if ($r >= 85) {
            return '2.00 (Good)';
        }
        if ($r >= 80) {
            return '2.25 (Satisfactory)';
        }
        if ($r >= 75) {
            return '2.50 – 3.00 (Passing)';
        }

        return '5.00 (Needs Improvement / Failing)';
    }

    private function getStudentState(User $user)
    {
        $placement = Placement::where('student_id', $user->id)->first();
        $attendances = Attendance::where('student_id', $user->id)->orderBy('date', 'desc')->orderBy('id', 'desc')->get();
        $tasks = Task::where('student_id', $user->id)->orderBy('created_at', 'desc')->get();
        $journals = Journal::where('student_id', $user->id)->orderBy('entry_date', 'desc')->get();
        $reports = AccomplishmentReport::where('student_id', $user->id)->orderBy('created_at', 'desc')->get();
        $feedbacks = Feedback::where('student_id', $user->id)->orderBy('created_at', 'desc')->get();
        $evaluations = Evaluation::where('student_id', $user->id)->orderBy('created_at', 'desc')->get();

        $defaultReqs = [
            'Parent Consent Form' => 'Notarized parent/guardian consent form',
            'Weekly Accomplishment Report' => 'Periodic synthesis report (PDF/DOCX)',
            'Medical' => 'Updated health certificate',
        ];

        $dbReqs = Requirement::where('student_id', $user->id)->get()->keyBy('name');
        $requirements = [];
        foreach ($defaultReqs as $reqName => $meta) {
            $existing = $dbReqs->get($reqName);
            if (! $existing && $reqName === 'Medical') {
                $existing = $dbReqs->get('Medical Clearance Renewal');
            }
            $requirements[] = [
                'name' => $reqName,
                'meta' => $meta,
                'status' => $existing ? $existing->status : 'Not submitted',
                'remarks' => $existing ? $existing->remarks : null,
            ];
        }

        $totalHours = (float) $attendances->whereIn('status', ['Present', 'Late'])->sum('total_hours');
        $daysPresent = $attendances->whereIn('status', ['Present', 'Late'])->count();
        $daysAbsent = $attendances->where('status', 'Absent')->count();
        $todayStr = Carbon::today()->toDateString();
        $attendanceRecordedToday = $attendances->where('date', $todayStr)->isNotEmpty();

        $applicationData = null;
        $isApproved = false;
        $approvalStatus = 'Pending Assignment';

        if ($placement) {
            $isApproved = in_array($placement->status, ['Active', 'Approved']);
            $approvalStatus = $isApproved ? 'Approved' : ($placement->status ?: 'Pending');

            $applicationData = [
                'id' => 'OJT-'.($placement->period ?? '2026').'-'.str_pad($placement->id, 4, '0', STR_PAD_LEFT),
                'dateSubmitted' => $placement->created_at->format('M d, Y'),
                'period' => $placement->period ?? 'AY 2025–2026',
                'company' => $placement->company_name,
                'department' => $placement->department ?? 'Unassigned',
                'supervisor' => $placement->supervisor_name ?? 'Unassigned',
                'supervisorEmail' => $placement->supervisor_email ?? '',
                'officeHours' => $placement->office_hours ?? '8:00 AM – 5:00 PM',
                'status' => $placement->status,
                'isApproved' => $isApproved,
                'notes' => $placement->notes,
            ];
        }

        $attendanceLogs = $attendances->map(function ($a) {
            return [
                'id' => $a->id,
                'date' => Carbon::parse($a->date)->format('M d, Y'),
                'rawDate' => $a->date,
                'schedule' => $a->schedule ?? 'Regular',
                'timeIn' => $a->time_in ?? '8:00 AM',
                'timeOut' => $a->time_out ?? '5:00 PM',
                'total' => $a->total_hours.' hrs',
                'totalHours' => $a->total_hours,
                'status' => $a->status,
                'remarks' => $a->remarks,
            ];
        })->values()->all();

        $taskList = $tasks->map(function ($t) {
            return [
                'id' => $t->id,
                'title' => $t->title,
                'due' => $t->due_date ? Carbon::parse($t->due_date)->format('M d, Y') : 'No deadline',
                'meta' => $t->meta,
                'details' => $t->details,
                'done' => (bool) $t->is_completed,
            ];
        })->values()->all();

        $journalList = $journals->map(function ($j) {
            return [
                'id' => $j->id,
                'title' => $j->title,
                'reflection' => $j->reflection,
                'date' => Carbon::parse($j->entry_date)->format('M d, Y'),
                'hours' => $j->hours,
                'status' => $j->status,
                'remarks' => $j->supervisor_remarks,
            ];
        })->values()->all();

        $reportList = $reports->map(function ($r) {
            return [
                'id' => $r->id,
                'title' => $r->title,
                'period' => $r->period ?? 'Current period',
                'submitted' => $r->created_at->format('M d, Y'),
                'status' => $r->status,
                'remarks' => $r->adviser_remarks ?? $r->remarks,
            ];
        })->values()->all();

        $feedbackList = $feedbacks->map(function ($f) {
            $supervisor = User::find($f->supervisor_id);

            return [
                'id' => $f->id,
                'supervisor' => $supervisor ? $supervisor->name : 'Department Supervisor',
                'rating' => $f->rating,
                'notes' => $f->notes,
                'date' => $f->created_at->format('M d, Y'),
            ];
        })->values()->all();

        $evaluationsList = $evaluations->map(function ($e) {
            $evaluator = User::find($e->evaluator_id);

            return [
                'id' => $e->id,
                'evaluator' => $evaluator ? $evaluator->name : 'Campus Department Supervisor',
                'rating' => $e->rating,
                'gradeEquiv' => $this->calculateGradeEquiv($e->rating),
                'comments' => $e->comments,
                'period' => $e->period ?? 'Workplace Final Appraisal',
                'status' => $e->status,
                'date' => $e->created_at->format('M d, Y'),
            ];
        })->values()->all();

        return [
            'isApproved' => $isApproved,
            'approvalStatus' => $approvalStatus,
            'totalHours' => round($totalHours, 2),
            'daysPresent' => $daysPresent,
            'daysAbsent' => $daysAbsent,
            'attendanceRecorded' => $attendanceRecordedToday,
            'attendance' => ($daysPresent + $daysAbsent) > 0 ? round(($daysPresent / ($daysPresent + $daysAbsent)) * 100) : 0,
            'requirements' => $requirements,
            'application' => $applicationData,
            'attendanceLogs' => $attendanceLogs,
            'tasks' => $taskList,
            'journals' => $journalList,
            'reports' => $reportList,
            'feedbacks' => $feedbackList,
            'evaluations' => $evaluationsList,
            'supervisorData' => [
                'students' => [],
            ],
        ];
    }

    private function getSupervisorState(User $user)
    {
        // Trainees assigned ONLY to this supervisor's department or specifically to this supervisor
        $studentIds = self::getSupervisorStudentIds($user);
        $students = User::where('role', 'student')->whereIn('id', $studentIds)->get();

        $studentList = $students->map(function ($s) {
            $placement = Placement::where('student_id', $s->id)->first();
            $attendances = Attendance::where('student_id', $s->id)->get();
            $hours = (float) $attendances->whereIn('status', ['Present', 'Late'])->sum('total_hours');
            $latestTask = Task::where('student_id', $s->id)->latest()->first();
            $latestJournal = Journal::where('student_id', $s->id)->latest()->first();
            $latestReport = AccomplishmentReport::where('student_id', $s->id)->latest()->first();
            $latestAttendance = Attendance::where('student_id', $s->id)->latest('date')->first();
            $latestEval = Evaluation::where('student_id', $s->id)->latest()->first();
            $latestFeedback = Feedback::where('student_id', $s->id)->latest()->first();
            $reqCount = Requirement::where('student_id', $s->id)->where('status', 'Approved')->count();
            $pendingReqCount = Requirement::where('student_id', $s->id)->where('status', 'Pending review')->count();

            return [
                'id' => $s->id,
                'name' => $s->name,
                'email' => $s->email,
                'idNumber' => $s->id_number ?? '2026-TG',
                'program' => $s->department ?? 'BS Information Technology',
                'department' => $placement ? ($placement->department ?? ($placement->company_name ?? 'Assigned Unit')) : 'Assigned Unit',
                'company' => $placement ? $placement->company_name : ($s->department ?? 'Campus Department / Office'),
                'hours' => round($hours, 1).' / 480 hrs',
                'progress' => min(100, round(($hours / 480) * 100)).'%',
                'status' => $placement ? (in_array($placement->status, ['Active', 'Approved']) ? 'Approved' : $placement->status) : 'Pending',
                'requirements' => "{$reqCount}/4 approved".($pendingReqCount > 0 ? " ({$pendingReqCount} pending)" : ''),
                'pendingRequirements' => $pendingReqCount,
                'evalStatus' => $latestEval ? $latestEval->status : 'Pending',
                'evalRating' => $latestEval ? $latestEval->rating : 0,
                'evalGrade' => $latestEval ? $this->calculateGradeEquiv($latestEval->rating) : '—',
                'evalComments' => $latestEval ? $latestEval->comments : '',
                'feedbackStatus' => $latestFeedback ? 'Feedback provided' : 'Pending',
                'feedbackRating' => $latestFeedback ? $latestFeedback->rating : 0,
                'feedbackNotes' => $latestFeedback ? $latestFeedback->notes : '',
                'journalTask' => $latestJournal ? $latestJournal->title : 'Daily reflection',
                'journalReflection' => $latestJournal ? $latestJournal->reflection : '',
                'journalDate' => $latestJournal ? Carbon::parse($latestJournal->entry_date)->format('M d, Y') : '—',
                'journalStatus' => $latestJournal ? $latestJournal->status : 'Pending',
                'attendanceDate' => $latestAttendance ? Carbon::parse($latestAttendance->date)->format('M d, Y') : '—',
                'attendanceTimes' => $latestAttendance ? ($latestAttendance->time_in.' – '.$latestAttendance->time_out) : '—',
                'attendanceHours' => $latestAttendance ? $latestAttendance->total_hours : 0,
                'attendanceStatus' => $latestAttendance ? $latestAttendance->status : 'Pending',
                'taskTitle' => $latestTask ? $latestTask->title : '',
                'taskDue' => $latestTask && $latestTask->due_date ? Carbon::parse($latestTask->due_date)->format('M d, Y') : '—',
                'taskStatus' => $latestTask ? ($latestTask->is_completed ? 'Completed' : 'In progress') : 'Open',
                'reportTitle' => $latestReport ? $latestReport->title : '',
                'reportSummary' => $latestReport ? $latestReport->summary : '',
                'reportPeriod' => $latestReport ? ($latestReport->period ?? 'Current period') : '—',
                'reportStatus' => $latestReport ? $latestReport->status : 'Pending',
            ];
        })->values()->all();

        $attendancesList = Attendance::with('student')
            ->whereIn('student_id', $studentIds)
            ->latest('date')
            ->orderBy('id', 'desc')
            ->get()
            ->map(function ($a) {
                return [
                    'id' => $a->id,
                    'studentName' => $a->student ? $a->student->name : 'Student',
                    'studentProgram' => $a->student ? $a->student->department : '',
                    'date' => Carbon::parse($a->date)->format('M d, Y'),
                    'rawDate' => $a->date,
                    'schedule' => $a->schedule,
                    'timeIn' => $a->time_in,
                    'timeOut' => $a->time_out,
                    'total' => $a->total_hours.' hrs',
                    'totalHours' => $a->total_hours,
                    'status' => $a->status,
                    'remarks' => $a->remarks,
                ];
            })->values()->all();

        $journalsList = Journal::with('student')
            ->whereIn('student_id', $studentIds)
            ->latest('entry_date')
            ->get()
            ->map(function ($j) {
                return [
                    'id' => $j->id,
                    'studentName' => $j->student ? $j->student->name : 'Student',
                    'title' => $j->title,
                    'reflection' => $j->reflection,
                    'date' => Carbon::parse($j->entry_date)->format('M d, Y'),
                    'hours' => $j->hours,
                    'status' => $j->status,
                    'remarks' => $j->supervisor_remarks,
                ];
            })->values()->all();

        $tasksList = Task::with('student')
            ->whereIn('student_id', $studentIds)
            ->latest()
            ->get()
            ->map(function ($t) {
                return [
                    'id' => $t->id,
                    'studentName' => $t->student ? $t->student->name : 'Student',
                    'title' => $t->title,
                    'details' => $t->details,
                    'due' => $t->due_date ? Carbon::parse($t->due_date)->format('M d, Y') : 'No deadline',
                    'meta' => $t->meta,
                    'done' => (bool) $t->is_completed,
                ];
            })->values()->all();

        $evaluationsList = Evaluation::with('student')
            ->whereIn('student_id', $studentIds)
            ->latest()
            ->get()
            ->map(function ($e) {
                return [
                    'id' => $e->id,
                    'studentName' => $e->student ? $e->student->name : 'Student',
                    'period' => $e->period ?? 'Workplace Appraisal',
                    'rating' => $e->rating,
                    'gradeEquiv' => $this->calculateGradeEquiv($e->rating),
                    'comments' => $e->comments,
                    'status' => $e->status,
                    'date' => $e->created_at->format('M d, Y'),
                ];
            })->values()->all();

        $feedbacksList = Feedback::with('student')
            ->whereIn('student_id', $studentIds)
            ->latest()
            ->get()
            ->map(function ($f) {
                return [
                    'id' => $f->id,
                    'studentName' => $f->student ? $f->student->name : 'Student',
                    'rating' => $f->rating,
                    'notes' => $f->notes,
                    'date' => $f->created_at->format('M d, Y'),
                ];
            })->values()->all();

        $studentRequirements = Requirement::with('student')
            ->whereIn('student_id', $studentIds)
            ->latest()
            ->get()
            ->map(function ($r) {
                return [
                    'id' => $r->id,
                    'studentName' => $r->student ? $r->student->name : 'Student',
                    'studentProgram' => $r->student ? $r->student->department : '',
                    'name' => $r->name,
                    'meta' => $r->meta,
                    'status' => $r->status,
                    'remarks' => $r->remarks,
                    'submittedAt' => $r->updated_at->format('M d, Y h:i A'),
                ];
            })->values()->all();

        return [
            'supervisorDepartment' => $user->department ?? 'General Campus Unit',
            'supervisorName' => $user->name,
            'supervisorData' => [
                'students' => $studentList,
            ],
            'students' => $studentList,
            'attendanceLogs' => $attendancesList,
            'journals' => $journalsList,
            'tasks' => $tasksList,
            'evaluations' => $evaluationsList,
            'feedbacks' => $feedbacksList,
            'studentRequirements' => $studentRequirements,
            'totalHours' => 0,
            'daysPresent' => 0,
            'daysAbsent' => 0,
            'attendance' => count($studentList) > 0 ? 100 : 0,
            'requirements' => [],
            'application' => null,
            'reports' => [],
        ];
    }

    private function getAdviserState(User $user)
    {
        $students = User::where('role', 'student')->get();
        $studentIds = $students->pluck('id');
        $supervisors = User::where('role', 'supervisor')->get();

        // Distinct available host departments for filtering
        $placementDepts = Placement::whereNotNull('company_name')
            ->where('company_name', '!=', '')
            ->pluck('company_name');

        $supervisorDepts = $supervisors->pluck('department')->filter();

        $standardDepts = collect([
            'Management Information Systems (MIS) / ICT Center',
            'Office of the Campus Registrar',
            'Campus Library & Learning Resource Center',
            'Office of the Campus Dean',
            'Administrative & Finance Services',
            'College of Computing Studies Laboratory',
            'Campus Clinic / Health Services',
        ]);

        $availableDepartments = $standardDepts
            ->merge($placementDepts)
            ->merge($supervisorDepts)
            ->filter()
            ->unique()
            ->values()
            ->all();

        $studentList = $students->map(function ($s) {
            $placement = Placement::where('student_id', $s->id)->first();
            $attendances = Attendance::where('student_id', $s->id)->get();
            $hours = (float) $attendances->whereIn('status', ['Present', 'Late'])->sum('total_hours');
            $reqCount = Requirement::where('student_id', $s->id)->where('status', 'Approved')->count();
            $pendingReqCount = Requirement::where('student_id', $s->id)->where('status', 'Pending review')->count();
            $reportsCount = AccomplishmentReport::where('student_id', $s->id)->count();
            $latestEval = Evaluation::where('student_id', $s->id)->latest()->first();

            return [
                'id' => $s->id,
                'name' => $s->name,
                'email' => $s->email,
                'idNumber' => $s->id_number ?? '2026-TG',
                'program' => $s->department ?? 'BS Information Technology',
                'department' => $placement ? ($placement->department ?? 'Unassigned') : 'Unassigned',
                'company' => $placement ? $placement->company_name : 'Unassigned Campus Department',
                'supervisor' => $placement ? ($placement->supervisor_name ?? 'Unassigned') : 'Unassigned',
                'supervisorEmail' => $placement ? ($placement->supervisor_email ?? '') : '',
                'hours' => round($hours, 1).' / 480 hrs',
                'progress' => min(100, round(($hours / 480) * 100)).'%',
                'status' => $placement ? (in_array($placement->status, ['Active', 'Approved']) ? 'Approved' : $placement->status) : 'Pending',
                'requirements' => "{$reqCount}/4 approved".($pendingReqCount > 0 ? " ({$pendingReqCount} pending)" : ''),
                'pendingRequirements' => $pendingReqCount,
                'reports' => "{$reportsCount} submitted",
                'evalRating' => $latestEval ? $latestEval->rating : null,
                'evalGrade' => $latestEval ? $this->calculateGradeEquiv($latestEval->rating) : 'Pending',
            ];
        })->values()->all();

        $pendingRequirements = Requirement::with('student')
            ->whereIn('student_id', $studentIds)
            ->where('status', 'Pending review')
            ->get()
            ->map(function ($r) {
                $placement = Placement::where('student_id', $r->student_id)->first();

                return [
                    'id' => $r->id,
                    'studentName' => $r->student ? $r->student->name : 'Student',
                    'studentProgram' => $r->student ? $r->student->department : '',
                    'department' => $placement ? $placement->company_name : 'Unassigned',
                    'name' => $r->name,
                    'meta' => $r->meta,
                    'submittedAt' => $r->updated_at->format('M d, Y h:i A'),
                    'previewUrl' => $r->file_path ? url('/practicum/requirements/'.$r->id.'/preview') : null,
                    'hasFile' => (bool) $r->file_path,
                ];
            })->values()->all();

        $reviewRequirements = Requirement::with('student')
            ->whereIn('student_id', $studentIds)
            ->whereNotNull('file_path')
            ->latest('updated_at')
            ->get()
            ->map(function ($r) {
                $placement = Placement::where('student_id', $r->student_id)->first();

                return [
                    'id' => $r->id,
                    'studentName' => $r->student ? $r->student->name : 'Student',
                    'studentProgram' => $r->student ? $r->student->department : '',
                    'department' => $placement ? $placement->company_name : 'Unassigned',
                    'name' => $r->name,
                    'meta' => $r->meta,
                    'status' => $r->status,
                    'remarks' => $r->remarks,
                    'submittedAt' => $r->updated_at->format('M d, Y h:i A'),
                    'previewUrl' => url('/practicum/requirements/'.$r->id.'/preview'),
                    'hasFile' => true,
                ];
            })->values()->all();

        $reportsList = AccomplishmentReport::with('student')
            ->whereIn('student_id', $studentIds)
            ->latest()
            ->get()
            ->map(function ($rep) {
                $placement = Placement::where('student_id', $rep->student_id)->first();

                return [
                    'id' => $rep->id,
                    'studentName' => $rep->student ? $rep->student->name : 'Student',
                    'department' => $placement ? $placement->company_name : 'Unassigned',
                    'title' => $rep->title,
                    'summary' => $rep->summary,
                    'period' => $rep->period ?? 'Weekly Report',
                    'status' => $rep->status,
                    'remarks' => $rep->adviser_remarks ?? $rep->remarks,
                    'submitted' => $rep->created_at->format('M d, Y'),
                ];
            })->values()->all();

        return [
            'students' => $studentList,
            'availableDepartments' => $availableDepartments,
            'supervisors' => $supervisors->map(fn ($sup) => [
                'id' => $sup->id,
                'name' => $sup->name,
                'department' => $sup->department,
                'email' => $sup->email,
            ]),
            'pendingRequirements' => $pendingRequirements,
            'reviewRequirements' => $reviewRequirements,
            'reports' => $reportsList,
            'supervisorData' => [
                'students' => $studentList,
            ],
            'totalHours' => 0,
            'daysPresent' => 0,
            'daysAbsent' => 0,
            'attendance' => count($studentList) > 0 ? 100 : 0,
            'requirements' => [],
            'application' => null,
            'attendanceLogs' => [],
            'tasks' => [],
            'journals' => [],
            'feedbacks' => [],
            'evaluations' => [],
        ];
    }

    private function getAdminState(User $user)
    {
        $allUsers = User::all()->map(function ($u) {
            return [
                'id' => $u->id,
                'name' => $u->name,
                'username' => $u->username,
                'email' => $u->email,
                'idNumber' => $u->id_number ?? '—',
                'role' => match ($u->role) {
                    'supervisor' => 'Department Supervisor',
                    'adviser' => 'OJT Adviser',
                    'admin' => 'Portal Administrator',
                    default => 'OJT Student',
                },
                'roleKey' => $u->role,
                'department' => $u->department ?? 'General',
                'createdAt' => $u->created_at ? $u->created_at->format('M d, Y') : '—',
            ];
        })->values()->all();

        $supervisors = User::where('role', 'supervisor')->get()->map(function ($s) {
            return [
                'id' => $s->id,
                'name' => $s->name,
                'username' => $s->username,
                'email' => $s->email,
                'department' => $s->department ?? 'General Campus Unit',
            ];
        })->values()->all();

        $students = User::where('role', 'student')->get();
        $studentList = $students->map(function ($s) {
            $placement = Placement::where('student_id', $s->id)->first();
            $attendances = Attendance::where('student_id', $s->id)->get();
            $hours = (float) $attendances->whereIn('status', ['Present', 'Late'])->sum('total_hours');
            $reqCount = Requirement::where('student_id', $s->id)->where('status', 'Approved')->count();
            $pendingReqCount = Requirement::where('student_id', $s->id)->where('status', 'Pending review')->count();
            $reportsCount = AccomplishmentReport::where('student_id', $s->id)->count();
            $latestEval = Evaluation::where('student_id', $s->id)->latest()->first();

            return [
                'id' => $s->id,
                'name' => $s->name,
                'email' => $s->email,
                'idNumber' => $s->id_number ?? '2026-TG',
                'program' => $s->department ?? 'BS Information Technology',
                'department' => $placement ? ($placement->department ?? 'Unassigned') : 'Unassigned',
                'company' => $placement ? ($placement->company_name ?? 'Unassigned Campus Department') : 'Unassigned Campus Department',
                'supervisor' => $placement ? ($placement->supervisor_name ?? 'Unassigned') : 'Unassigned',
                'supervisorEmail' => $placement ? ($placement->supervisor_email ?? '') : '',
                'hours' => round($hours, 1).' / 480 hrs',
                'progress' => min(100, round(($hours / 480) * 100)).'%',
                'status' => $placement ? (in_array($placement->status, ['Active', 'Approved']) ? 'Approved' : $placement->status) : 'Pending',
                'requirements' => "{$reqCount}/4 approved".($pendingReqCount > 0 ? " ({$pendingReqCount} pending)" : ''),
                'pendingRequirements' => $pendingReqCount,
                'reports' => "{$reportsCount} submitted",
                'evalRating' => $latestEval ? $latestEval->rating : null,
                'evalGrade' => $latestEval ? $this->calculateGradeEquiv($latestEval->rating) : 'Pending',
            ];
        })->values()->all();

        $standardDepts = [
            'Management Information Systems (MIS) / ICT Center',
            'Office of the Campus Registrar',
            'Campus Library & Learning Resource Center',
            'Office of the Campus Dean',
            'Administrative & Finance Services',
            'College of Computing Studies Laboratory',
            'Campus Clinic / Health Services',
        ];

        // Compile Department Summaries
        $departmentsSummary = [];
        foreach ($standardDepts as $deptName) {
            $deptSupervisors = User::where('role', 'supervisor')
                ->where(function ($q) use ($deptName) {
                    $q->where('department', $deptName)
                        ->orWhere('department', 'like', "%{$deptName}%");
                })->get();

            $deptTrainees = array_values(array_filter($studentList, function ($st) use ($deptName) {
                return $st['company'] === $deptName || str_contains($st['company'], $deptName) || str_contains($deptName, $st['company']);
            }));

            $activeCount = count(array_filter($deptTrainees, fn ($st) => in_array($st['status'], ['Active', 'Approved'])));
            $pendingCount = count($deptTrainees) - $activeCount;

            $departmentsSummary[] = [
                'name' => $deptName,
                'supervisors' => $deptSupervisors->pluck('name')->all(),
                'supervisorEmails' => $deptSupervisors->pluck('email')->all(),
                'supervisorDisplay' => $deptSupervisors->isNotEmpty() ? $deptSupervisors->pluck('name')->join(', ') : 'Unassigned',
                'traineesCount' => count($deptTrainees),
                'activeCount' => $activeCount,
                'pendingCount' => $pendingCount,
                'trainees' => $deptTrainees,
            ];
        }

        // Aggregate Institutional Audit Logs
        $auditLogs = [];

        // 1. Placements
        $placements = Placement::with('student')->latest('updated_at')->get();
        foreach ($placements as $p) {
            $studentName = $p->student?->name ?? 'Student Trainee';
            $auditLogs[] = [
                'id' => 'place-'.$p->id,
                'category' => 'Placement',
                'action' => 'Placement '.($p->status ?: 'Updated'),
                'actor' => $p->supervisor_name ?: 'OJT Coordinator',
                'target' => $studentName,
                'details' => "Assigned to {$p->company_name} ({$p->department})",
                'status' => $p->status ?: 'Pending',
                'timestamp' => $p->updated_at ? $p->updated_at->format('M d, Y h:i A') : now()->format('M d, Y h:i A'),
                'rawTime' => $p->updated_at ? $p->updated_at->timestamp : 0,
            ];
        }

        // 2. Clearances
        $requirements = Requirement::with('student')->latest('updated_at')->get();
        foreach ($requirements as $r) {
            $studentName = $r->student?->name ?? 'Student Trainee';
            $auditLogs[] = [
                'id' => 'req-'.$r->id,
                'category' => 'Clearance',
                'action' => 'Document '.($r->status ?: 'Submitted'),
                'actor' => $r->reviewed_by ?: ($r->status === 'Approved' ? 'Supervisor / Adviser' : $studentName),
                'target' => $studentName,
                'details' => "{$r->name} (Status: {$r->status})",
                'status' => $r->status ?: 'Pending',
                'timestamp' => $r->updated_at ? $r->updated_at->format('M d, Y h:i A') : now()->format('M d, Y h:i A'),
                'rawTime' => $r->updated_at ? $r->updated_at->timestamp : 0,
            ];
        }

        // 3. Attendance
        $attendances = Attendance::with('student')->latest('updated_at')->take(40)->get();
        foreach ($attendances as $a) {
            $studentName = $a->student?->name ?? 'Student Trainee';
            $auditLogs[] = [
                'id' => 'att-'.$a->id,
                'category' => 'Attendance',
                'action' => 'DTR Shift '.($a->status ?: 'Recorded'),
                'actor' => $studentName,
                'target' => $studentName,
                'details' => "Rendered {$a->total_hours} hrs ({$a->schedule}) on {$a->date}",
                'status' => $a->status ?: 'Present',
                'timestamp' => $a->updated_at ? $a->updated_at->format('M d, Y h:i A') : now()->format('M d, Y h:i A'),
                'rawTime' => $a->updated_at ? $a->updated_at->timestamp : 0,
            ];
        }

        // 4. Evaluations
        $evaluations = Evaluation::with(['student', 'supervisor'])->latest('updated_at')->get();
        foreach ($evaluations as $e) {
            $studentName = $e->student?->name ?? 'Student Trainee';
            $supervisorName = $e->supervisor?->name ?? 'Department Supervisor';
            $auditLogs[] = [
                'id' => 'eval-'.$e->id,
                'category' => 'Evaluation',
                'action' => 'Performance Evaluation',
                'actor' => $supervisorName,
                'target' => $studentName,
                'details' => "Score: {$e->rating}/100 ({$e->period}) for {$studentName}",
                'status' => 'Completed',
                'timestamp' => $e->updated_at ? $e->updated_at->format('M d, Y h:i A') : now()->format('M d, Y h:i A'),
                'rawTime' => $e->updated_at ? $e->updated_at->timestamp : 0,
            ];
        }

        // 5. User Accounts
        $usersList = User::latest('updated_at')->get();
        foreach ($usersList as $u) {
            $roleLabel = match ($u->role) {
                'supervisor' => 'Department Supervisor',
                'adviser' => 'OJT Adviser',
                'admin' => 'Portal Administrator',
                default => 'Student Trainee',
            };
            $auditLogs[] = [
                'id' => 'user-'.$u->id,
                'category' => 'User Accounts',
                'action' => 'Account Registered / Updated',
                'actor' => 'System Administrator',
                'target' => $u->name,
                'details' => "Role: {$roleLabel} | Unit: {$u->department}",
                'status' => 'Active',
                'timestamp' => $u->updated_at ? $u->updated_at->format('M d, Y h:i A') : now()->format('M d, Y h:i A'),
                'rawTime' => $u->updated_at ? $u->updated_at->timestamp : 0,
            ];
        }

        // Sort all audit logs by timestamp descending
        usort($auditLogs, fn ($a, $b) => $b['rawTime'] <=> $a['rawTime']);

        return [
            'allUsers' => $allUsers,
            'supervisors' => $supervisors,
            'students' => $studentList,
            'availableDepartments' => $standardDepts,
            'departmentsSummary' => $departmentsSummary,
            'auditLogs' => $auditLogs,
            'supervisorData' => [
                'students' => $studentList,
            ],
            'totalHours' => 0,
            'daysPresent' => 0,
            'daysAbsent' => 0,
            'attendance' => 0,
            'requirements' => [],
            'application' => null,
            'attendanceLogs' => [],
            'tasks' => [],
            'journals' => [],
            'reports' => [],
        ];
    }

    public function recordAttendance(Request $request)
    {
        $user = Auth::user();
        if (! $user || $user->role !== 'student') {
            return response()->json(['error' => 'Unauthorized. Only students can record attendance.'], $user ? 403 : 401);
        }

        $date = $request->input('date', Carbon::today()->toDateString());
        $schedule = $request->input('schedule', 'Regular (8h)');
        $timeIn = $request->input('time_in', '8:00 AM');
        $timeOut = $request->input('time_out', '5:00 PM');
        $totalHours = (float) $request->input('total_hours', 8.00);
        $remarks = $request->input('remarks');

        $attendance = Attendance::create([
            'student_id' => $user->id,
            'date' => $date,
            'schedule' => $schedule,
            'time_in' => $timeIn,
            'time_out' => $timeOut,
            'total_hours' => $totalHours,
            'status' => 'Present',
            'remarks' => $remarks,
        ]);

        return response()->json([
            'success' => true,
            'message' => "Time record for {$date} ({$timeIn} – {$timeOut}, {$totalHours} hrs) has been recorded.",
            'attendance' => $attendance,
        ]);
    }

    public function updateApplication(Request $request)
    {
        $user = Auth::user();
        if (! $user) {
            return response()->json(['error' => 'Unauthenticated'], 401);
        }

        if ($user->role === 'student') {
            return response()->json([
                'error' => 'Campus department placement is read-only for students and is assigned directly by your OJT Faculty Adviser.',
            ], 403);
        }

        $validated = $request->validate([
            'organization' => 'required|string|max:255',
            'department' => 'required|string|max:255',
            'supervisor' => 'required|string|max:255',
            'email' => 'nullable|email|max:255',
        ]);

        $placement = Placement::updateOrCreate(
            ['student_id' => $user->id],
            [
                'company_name' => $validated['organization'],
                'department' => $validated['department'],
                'supervisor_name' => $validated['supervisor'],
                'supervisor_email' => $validated['email'] ?? null,
                'status' => 'Active',
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'Placement details updated successfully.',
            'placement' => $placement,
        ]);
    }

    public function assignStudent(Request $request)
    {
        $user = Auth::user();
        if (! $user || ! in_array($user->role, ['adviser', 'admin'])) {
            return response()->json(['error' => 'Unauthorized. Only OJT Advisers and Administrators can assign students to departments.'], 403);
        }

        $validated = $request->validate([
            'student' => 'required|string',
            'company_name' => 'required|string|max:255',
            'department' => 'required|string|max:255',
            'supervisor_name' => 'required|string|max:255',
            'supervisor_email' => 'nullable|email|max:255',
            'notes' => 'nullable|string',
        ]);

        $student = User::where(function ($q) use ($validated) {
            $q->where('id', $validated['student'])
                ->orWhere('name', $validated['student'])
                ->orWhere('username', $validated['student']);
        })->where('role', 'student')->first();

        if (! $student) {
            return response()->json(['error' => 'Student trainee not found.'], 404);
        }

        // Match Supervisor User record if existing
        $supervisorUser = null;
        if (! empty($validated['supervisor_email'])) {
            $supervisorUser = User::where('email', $validated['supervisor_email'])->where('role', 'supervisor')->first();
        }
        if (! $supervisorUser && ! empty($validated['supervisor_name'])) {
            $supervisorUser = User::where('name', $validated['supervisor_name'])->where('role', 'supervisor')->first();
        }
        if (! $supervisorUser && ! empty($validated['company_name'])) {
            $supervisorUser = User::where('role', 'supervisor')
                ->where(function ($q) use ($validated) {
                    $q->where('department', $validated['company_name'])
                        ->orWhere('department', 'like', '%'.$validated['company_name'].'%');
                })->first();
        }

        if (! $supervisorUser) {
            return response()->json(['error' => 'Select a valid supervisor for the assigned department.'], 422);
        }

        $supervisorDepartment = strtolower(trim($supervisorUser->department ?? ''));
        $assignedDepartment = strtolower(trim($validated['company_name']));
        $supervisorParts = array_filter(array_map('trim', preg_split('/\s*\/\s*|\s*\([^)]*\)/', $supervisorDepartment)));
        $assignedParts = array_filter(array_map('trim', preg_split('/\s*\/\s*|\s*\([^)]*\)/', $assignedDepartment)));
        $hasMatchingDepartmentPart = collect($supervisorParts)->contains(fn (string $part): bool => strlen($part) >= 3 && str_contains($assignedDepartment, $part))
            || collect($assignedParts)->contains(fn (string $part): bool => strlen($part) >= 3 && str_contains($supervisorDepartment, $part));

        if (! $supervisorDepartment || (! str_contains($supervisorDepartment, $assignedDepartment) && ! str_contains($assignedDepartment, $supervisorDepartment) && ! $hasMatchingDepartmentPart)) {
            return response()->json(['error' => 'The selected supervisor does not belong to the assigned department.'], 422);
        }

        $placement = Placement::updateOrCreate(
            ['student_id' => $student->id],
            [
                'supervisor_id' => $supervisorUser ? $supervisorUser->id : null,
                'company_name' => $validated['company_name'],
                'department' => $validated['department'],
                'supervisor_name' => $validated['supervisor_name'],
                'supervisor_email' => $validated['supervisor_email'] ?? ($supervisorUser ? $supervisorUser->email : null),
                'notes' => $validated['notes'] ?? 'Assigned by OJT Adviser. Trainee must submit clearance documents to Supervisor.',
                'status' => 'Pending',
            ]
        );

        // Ensure default clearance documents are initialized
        $defaultReqs = [
            'Campus Placement & Endorsement Form' => 'Required endorsement signed by Campus Department Head and Dean',
            'Parent Consent Form' => 'Notarized parent/guardian consent form',
            'Weekly Accomplishment Report' => 'Periodic synthesis report (PDF/DOCX)',
            'Medical Clearance Renewal' => 'Updated health certificate',
        ];

        foreach ($defaultReqs as $rName => $rMeta) {
            Requirement::firstOrCreate(
                ['student_id' => $student->id, 'name' => $rName],
                ['meta' => $rMeta, 'status' => 'Pending review', 'remarks' => 'Submitted by student for supervisor evaluation']
            );
        }

        // Add initial department onboarding task
        Task::firstOrCreate(
            [
                'student_id' => $student->id,
                'title' => 'Submit Practicum Clearance Documents to '.$validated['supervisor_name'],
            ],
            [
                'due_date' => Carbon::now()->addDays(5)->toDateString(),
                'details' => "Report to {$validated['department']} and submit your endorsement and clearance documents to {$validated['supervisor_name']}.",
                'meta' => 'Placement Compliance',
                'is_completed' => false,
            ]
        );

        return response()->json([
            'success' => true,
            'message' => "{$student->name} assigned to {$validated['department']} ({$validated['company_name']}). Trainee must submit documents to Supervisor for department approval.",
            'placement' => $placement,
        ]);
    }

    public function approveStudent(Request $request)
    {
        $user = Auth::user();
        if (! $user || ! in_array($user->role, ['supervisor', 'admin'])) {
            return response()->json(['error' => 'Unauthorized. Only Department Supervisors can approve trainees.'], 403);
        }

        $validated = $request->validate([
            'student' => 'required|string',
            'decision' => 'required|in:Active,Approved,Revision,Pending',
            'notes' => 'nullable|string',
        ]);

        $decision = in_array($validated['decision'], ['Active', 'Approved']) ? 'Active' : $validated['decision'];
        $decisionLabel = $decision === 'Active' ? 'Approved' : $decision;

        $student = User::where(function ($q) use ($validated) {
            $q->where('id', $validated['student'])
                ->orWhere('name', $validated['student'])
                ->orWhere('username', $validated['student']);
        })->where('role', 'student')->first();

        if (! $student) {
            return response()->json(['error' => 'Student not found.'], 404);
        }

        // Department access check for supervisor
        if ($user->role === 'supervisor') {
            $allowedIds = self::getSupervisorStudentIds($user);
            $placement = Placement::where('student_id', $student->id)->first();
            if ($placement && ! $allowedIds->contains($student->id)) {
                return response()->json([
                    'error' => "Unauthorized. {$student->name} is not assigned to your department ({$user->department}).",
                ], 403);
            }
        }

        $placement = Placement::where('student_id', $student->id)->first();
        if (! $placement) {
            $placement = Placement::create([
                'student_id' => $student->id,
                'supervisor_id' => $user->id,
                'company_name' => $user->department ?? 'Campus Department / Office',
                'department' => $user->department ?? 'General Unit',
                'supervisor_name' => $user->name,
                'supervisor_email' => $user->email,
                'status' => $decision,
                'notes' => $validated['notes'] ?? null,
            ]);
        } else {
            $placement->status = $decision;
            if (! $placement->supervisor_id) {
                $placement->supervisor_id = $user->id;
            }
            if (! empty($validated['notes'])) {
                $placement->notes = $validated['notes'];
            }
            $placement->save();
        }

        return response()->json([
            'success' => true,
            'message' => "Student {$student->name} has been {$decisionLabel} by Department Supervisor.",
            'placement' => $placement,
        ]);
    }

    public function createTask(Request $request)
    {
        $user = Auth::user();
        if (! $user) {
            return response()->json(['error' => 'Unauthenticated'], 401);
        }

        if ($user->role === 'student') {
            return response()->json([
                'error' => 'Unauthorized. Tasks must be assigned directly by your campus department supervisor.',
            ], 403);
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'due' => 'nullable|date',
            'student' => 'required|string',
            'details' => 'nullable|string',
        ]);

        $studentObj = User::where(function ($q) use ($validated) {
            $q->where('name', $validated['student'])
                ->orWhere('id', $validated['student'])
                ->orWhere('username', $validated['student']);
        })->where('role', 'student')->first();

        if (! $studentObj) {
            return response()->json(['error' => 'Student trainee not found.'], 404);
        }

        // Supervisor department authorization check
        if ($user->role === 'supervisor') {
            $allowedIds = self::getSupervisorStudentIds($user);
            if (! $allowedIds->contains($studentObj->id)) {
                return response()->json([
                    'error' => "Unauthorized. {$studentObj->name} is not assigned to your department ({$user->department}).",
                ], 403);
            }
        }

        $task = Task::create([
            'student_id' => $studentObj->id,
            'assigned_by' => $user->id,
            'title' => $validated['title'],
            'due_date' => $validated['due'] ?? null,
            'details' => $validated['details'] ?? null,
            'meta' => $user->role === 'supervisor'
                ? "Department Supervisor Assigned ({$user->name})"
                : "Faculty Adviser Assigned ({$user->name})",
            'is_completed' => false,
        ]);

        return response()->json([
            'success' => true,
            'message' => "Task assigned to {$studentObj->name} successfully.",
            'task' => $task,
        ]);
    }

    public function toggleTask(Request $request, $id)
    {
        $user = Auth::user();
        if (! $user) {
            return response()->json(['error' => 'Unauthenticated'], 401);
        }

        $task = Task::where('id', $id)->first();
        if (! $task) {
            return response()->json(['error' => 'Task not found.'], 404);
        }

        if ($user->role === 'student' && $task->student_id !== $user->id) {
            return response()->json(['error' => 'Unauthorized. You can only update your own tasks.'], 403);
        }

        if ($user->role === 'supervisor' && ! self::getSupervisorStudentIds($user)->contains($task->student_id)) {
            return response()->json(['error' => 'Unauthorized. This task is outside your department.'], 403);
        }

        $task->is_completed = $request->boolean('done');
        $task->save();

        return response()->json(['success' => true]);
    }

    public function createJournal(Request $request)
    {
        $user = Auth::user();
        if (! $user || $user->role !== 'student') {
            return response()->json(['error' => 'Unauthorized. Only students can create journals.'], $user ? 403 : 401);
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'reflection' => 'required|string',
            'hours' => 'nullable|string',
        ]);

        $journal = Journal::create([
            'student_id' => $user->id,
            'title' => $validated['title'],
            'reflection' => $validated['reflection'],
            'entry_date' => Carbon::today()->toDateString(),
            'hours' => $validated['hours'] ?? '8 hours rendered',
            'status' => 'Submitted',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Daily journal submitted for supervisor review.',
            'journal' => $journal,
        ]);
    }

    public function createReport(Request $request)
    {
        $user = Auth::user();
        if (! $user || $user->role !== 'student') {
            return response()->json(['error' => 'Unauthorized. Only students can create reports.'], $user ? 403 : 401);
        }

        $validated = $request->validate([
            'week' => 'required|string|max:255',
            'summary' => 'required|string',
        ]);

        $report = AccomplishmentReport::create([
            'student_id' => $user->id,
            'title' => $validated['week'],
            'summary' => $validated['summary'],
            'period' => 'Weekly Synthesis',
            'status' => 'Pending review',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Accomplishment report submitted for Adviser verification.',
            'report' => $report,
        ]);
    }

    public function uploadRequirement(Request $request)
    {
        $user = Auth::user();
        if (! $user || $user->role !== 'student') {
            return response()->json(['error' => 'Unauthorized. Only students can upload requirements.'], $user ? 403 : 401);
        }

        $validated = $request->validate([
            'requirement' => 'required|string|max:255',
            'file' => 'required|file|mimes:pdf,jpg,jpeg,png,webp,heic,heif|max:25600',
        ], [
            'file.required' => 'Please attach a PDF or image document.',
            'file.mimes' => 'Only PDF, JPG, JPEG, PNG, WEBP, HEIC, or HEIF files are supported.',
            'file.max' => 'The document must be 25 MB or smaller.',
        ]);

        $filePath = $request->file('file')->store('requirements/'.$user->id, 'local');

        $req = Requirement::updateOrCreate(
            ['student_id' => $user->id, 'name' => $validated['requirement']],
            [
                'status' => 'Pending review',
                'meta' => 'Submitted document for supervisor & adviser evaluation',
                'file_path' => $filePath,
            ]
        );

        return response()->json([
            'success' => true,
            'message' => "Document '{$validated['requirement']}' uploaded. Status: Pending review by Department Supervisor / Adviser.",
            'requirement' => $req,
        ]);
    }

    public function previewRequirement(Request $request, int $id)
    {
        $user = Auth::user();
        if (! $user || ! in_array($user->role, ['adviser', 'supervisor', 'admin'])) {
            abort(403);
        }

        $requirement = Requirement::findOrFail($id);
        if ($user->role === 'adviser' && ! User::where('role', 'student')->whereKey($requirement->student_id)->exists()) {
            abort(403);
        }
        if ($user->role === 'supervisor' && ! self::getSupervisorStudentIds($user)->contains($requirement->student_id)) {
            abort(403);
        }

        if (! $requirement->file_path || ! Storage::disk('local')->exists($requirement->file_path)) {
            abort(404);
        }

        return response()->file(Storage::disk('local')->path($requirement->file_path), [
            'Content-Disposition' => 'inline; filename="'.basename($requirement->file_path).'"',
        ]);
    }

    public function reviewRequirement(Request $request)
    {
        $user = Auth::user();
        if (! $user || ! in_array($user->role, ['supervisor', 'adviser', 'admin'])) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $reqName = $request->input('requirement') ?? $request->input('requirement_name');
        if (empty($reqName)) {
            return response()->json(['error' => 'Requirement name is required.'], 422);
        }

        $validated = $request->validate([
            'student' => 'required|string',
            'decision' => 'required|in:Approved,Revision,Pending review',
            'comments' => 'nullable|string',
        ]);

        $student = User::where(function ($q) use ($validated) {
            $q->where('name', $validated['student'])
                ->orWhere('id', $validated['student'])
                ->orWhere('username', $validated['student']);
        })->where('role', 'student')->first();

        if (! $student) {
            return response()->json(['error' => 'Student not found'], 404);
        }

        // Supervisor department authorization check
        if ($user->role === 'supervisor') {
            $allowedIds = self::getSupervisorStudentIds($user);
            if (! $allowedIds->contains($student->id)) {
                return response()->json([
                    'error' => "Unauthorized. {$student->name} is not assigned to your department ({$user->department}).",
                ], 403);
            }
        }

        $req = Requirement::where('student_id', $student->id)
            ->where('name', $reqName)
            ->first();

        if ($req) {
            $req->status = $validated['decision'];
            $req->remarks = $validated['comments'];
            $req->save();
        } else {
            $req = Requirement::create([
                'student_id' => $student->id,
                'name' => $reqName,
                'status' => $validated['decision'],
                'remarks' => $validated['comments'],
                'meta' => "Evaluated by {$user->name} ({$user->role})",
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => "Document '{$reqName}' evaluated as '{$validated['decision']}' for {$student->name}.",
        ]);
    }

    public function reviewReport(Request $request)
    {
        return $this->reviewAccomplishmentReport($request);
    }

    public function reviewAccomplishmentReport(Request $request)
    {
        $user = Auth::user();
        if (! $user || ! in_array($user->role, ['supervisor', 'adviser', 'admin'])) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'student' => 'required|string',
            'decision' => 'required|in:Approved,Revision',
            'comments' => 'nullable|string',
        ]);

        $student = User::where(function ($q) use ($validated) {
            $q->where('name', $validated['student'])
                ->orWhere('id', $validated['student'])
                ->orWhere('username', $validated['student']);
        })->where('role', 'student')->first();
        if (! $student) {
            return response()->json(['error' => 'Student not found'], 404);
        }

        // Supervisor department authorization check
        if ($user->role === 'supervisor') {
            $allowedIds = self::getSupervisorStudentIds($user);
            if (! $allowedIds->contains($student->id)) {
                return response()->json([
                    'error' => "Unauthorized. {$student->name} is not assigned to your department ({$user->department}).",
                ], 403);
            }
        }

        $report = AccomplishmentReport::where('student_id', $student->id)->latest()->first();
        if ($report) {
            $report->status = $validated['decision'];
            $report->adviser_remarks = $validated['comments'];
            $report->save();
        }

        return response()->json([
            'success' => true,
            'message' => "Accomplishment report marked as '{$validated['decision']}' for {$student->name}.",
        ]);
    }

    public function saveEvaluation(Request $request)
    {
        $user = Auth::user();
        if (! $user || ! in_array($user->role, ['supervisor', 'adviser', 'admin'])) {
            return response()->json(['error' => 'Unauthorized. Only staff can submit evaluations.'], $user ? 403 : 401);
        }

        $validated = $request->validate([
            'student' => 'required|string',
            'rating' => 'required|numeric|min:1|max:100',
            'comment' => 'nullable|string',
        ]);

        $student = User::where(function ($q) use ($validated) {
            $q->where('name', $validated['student'])
                ->orWhere('id', $validated['student'])
                ->orWhere('username', $validated['student']);
        })->where('role', 'student')->first();

        if (! $student) {
            return response()->json(['error' => 'Student not found'], 404);
        }

        // Supervisor department authorization check
        if ($user->role === 'supervisor') {
            $allowedIds = self::getSupervisorStudentIds($user);
            if (! $allowedIds->contains($student->id)) {
                return response()->json([
                    'error' => "Unauthorized. {$student->name} is not assigned to your department ({$user->department}).",
                ], 403);
            }
        }

        $gradeEquiv = $this->calculateGradeEquiv($validated['rating']);

        $evaluation = Evaluation::updateOrCreate(
            ['student_id' => $student->id, 'period' => 'Workplace Appraisal'],
            [
                'evaluator_id' => $user->id,
                'rating' => $validated['rating'],
                'comments' => $validated['comment'] ?? '',
                'status' => 'Completed',
            ]
        );

        return response()->json([
            'success' => true,
            'message' => "Evaluation score {$validated['rating']}/100 ({$gradeEquiv}) saved for {$student->name}.",
            'evaluation' => $evaluation,
        ]);
    }

    public function saveFeedback(Request $request)
    {
        $user = Auth::user();
        if (! $user || ! in_array($user->role, ['supervisor', 'adviser', 'admin'])) {
            return response()->json(['error' => 'Unauthorized. Only staff can submit feedback.'], $user ? 403 : 401);
        }

        $validated = $request->validate([
            'student' => 'required|string',
            'rating' => 'required|numeric|min:1|max:100',
            'feedback' => 'nullable|string',
        ]);

        $student = User::where(function ($q) use ($validated) {
            $q->where('name', $validated['student'])
                ->orWhere('id', $validated['student'])
                ->orWhere('username', $validated['student']);
        })->where('role', 'student')->first();

        if (! $student) {
            return response()->json(['error' => 'Student not found'], 404);
        }

        // Supervisor department authorization check
        if ($user->role === 'supervisor') {
            $allowedIds = self::getSupervisorStudentIds($user);
            if (! $allowedIds->contains($student->id)) {
                return response()->json([
                    'error' => "Unauthorized. {$student->name} is not assigned to your department ({$user->department}).",
                ], 403);
            }
        }

        $feedback = Feedback::create([
            'student_id' => $student->id,
            'supervisor_id' => $user->id,
            'rating' => $validated['rating'],
            'notes' => $validated['feedback'] ?? '',
        ]);

        return response()->json([
            'success' => true,
            'message' => "Feedback with rating {$validated['rating']}/100 submitted for {$student->name}.",
            'feedback' => $feedback,
        ]);
    }

    public function reviewAttendance(Request $request)
    {
        $user = Auth::user();
        if (! $user || ! in_array($user->role, ['supervisor', 'adviser', 'admin'])) {
            return response()->json(['error' => 'Unauthorized. Only staff can review attendance.'], $user ? 403 : 401);
        }

        $studentName = $request->input('student');
        $student = User::where(function ($q) use ($studentName) {
            $q->where('name', $studentName)
                ->orWhere('id', $studentName)
                ->orWhere('username', $studentName);
        })->where('role', 'student')->first();

        if ($student) {
            // Supervisor department authorization check
            if ($user->role === 'supervisor') {
                $allowedIds = self::getSupervisorStudentIds($user);
                if (! $allowedIds->contains($student->id)) {
                    return response()->json([
                        'error' => "Unauthorized. {$student->name} is not assigned to your department ({$user->department}).",
                    ], 403);
                }
            }

            $latest = Attendance::where('student_id', $student->id)->latest('date')->first();
            if ($latest) {
                $latest->status = $request->input('decision') === 'Excused' ? 'Excused' : 'Present';
                $latest->remarks = $request->input('comments');
                $latest->save();
            }
        }

        return response()->json([
            'success' => true,
            'message' => "Attendance verification saved for {$studentName}.",
        ]);
    }

    public function reviewJournal(Request $request)
    {
        $user = Auth::user();
        if (! $user || ! in_array($user->role, ['supervisor', 'adviser', 'admin'])) {
            return response()->json(['error' => 'Unauthorized. Only staff can review journals.'], $user ? 403 : 401);
        }

        $studentName = $request->input('student');
        $student = User::where(function ($q) use ($studentName) {
            $q->where('name', $studentName)
                ->orWhere('id', $studentName)
                ->orWhere('username', $studentName);
        })->where('role', 'student')->first();

        if ($student) {
            // Supervisor department authorization check
            if ($user->role === 'supervisor') {
                $allowedIds = self::getSupervisorStudentIds($user);
                if (! $allowedIds->contains($student->id)) {
                    return response()->json([
                        'error' => "Unauthorized. {$student->name} is not assigned to your department ({$user->department}).",
                    ], 403);
                }
            }

            $latest = Journal::where('student_id', $student->id)->latest('entry_date')->first();
            if ($latest) {
                $latest->status = $request->input('decision') === 'Revision' ? 'Revision' : 'Approved';
                $latest->supervisor_remarks = $request->input('comments');
                $latest->save();
            }
        }

        return response()->json([
            'success' => true,
            'message' => "Journal review saved for {$studentName}.",
        ]);
    }

    public function updatePlacement(Request $request)
    {
        $user = Auth::user();
        if (! $user || ! in_array($user->role, ['supervisor', 'adviser', 'admin'])) {
            return response()->json(['error' => 'Unauthorized. Only staff can update placements.'], $user ? 403 : 401);
        }

        $studentName = $request->input('student');
        $student = User::where(function ($q) use ($studentName) {
            $q->where('name', $studentName)
                ->orWhere('id', $studentName)
                ->orWhere('username', $studentName);
        })->where('role', 'student')->first();

        if ($student) {
            if ($user->role === 'supervisor' && ! self::getSupervisorStudentIds($user)->contains($student->id)) {
                return response()->json(['error' => 'Unauthorized. This student is outside your department.'], 403);
            }

            Placement::updateOrCreate(
                ['student_id' => $student->id],
                [
                    'company_name' => $request->input('organization', 'Campus Department / Office'),
                    'department' => $request->input('department', 'Management Information Systems (MIS)'),
                    'notes' => $request->input('notes'),
                    'status' => 'Pending',
                ]
            );
        }

        return response()->json([
            'success' => true,
            'message' => "Placement details updated for {$studentName}.",
        ]);
    }

    public function adminAssignRole(Request $request)
    {
        $user = Auth::user();
        if (! $user || $user->role !== 'admin') {
            return response()->json(['error' => 'Unauthorized. Only Portal Administrators can assign roles.'], 403);
        }

        $validated = $request->validate([
            'user_id' => 'nullable',
            'supervisor_id' => 'nullable',
            'name' => 'nullable|string|max:255',
            'role' => 'required|string|in:supervisor,adviser,admin,student',
            'department' => 'nullable|string|max:255',
        ]);

        $targetUser = null;
        if (! empty($validated['user_id'])) {
            $targetUser = User::find($validated['user_id']);
        } elseif (! empty($validated['supervisor_id'])) {
            $targetUser = User::find($validated['supervisor_id']);
        } elseif (! empty($validated['name'])) {
            $targetUser = User::where('id', $validated['name'])
                ->orWhere('username', $validated['name'])
                ->orWhere('name', $validated['name'])
                ->first();
        }

        if (! $targetUser) {
            return response()->json([
                'error' => 'Department supervisor not found.',
            ], 404);
        }

        // The admin can ONLY assign roles to existing department supervisors
        if ($targetUser->role !== 'supervisor') {
            return response()->json([
                'error' => 'Unauthorized action. The admin can only assign roles to existing department supervisors.',
            ], 403);
        }

        $roleKey = $validated['role'];
        $targetUser->role = $roleKey;
        if (! empty($validated['department'])) {
            $targetUser->department = $validated['department'];
        }
        $targetUser->save();

        $roleTitle = match ($roleKey) {
            'supervisor' => 'Campus Department Supervisor',
            'adviser' => 'OJT Faculty Adviser',
            'admin' => 'Portal Administrator',
            default => 'OJT Student Trainee',
        };

        return response()->json([
            'success' => true,
            'message' => "Role '{$roleTitle}' assigned successfully to supervisor {$targetUser->name}.",
            'user' => $targetUser,
        ]);
    }

    public function adminAddUser(Request $request)
    {
        return $this->adminAssignRole($request);
    }
}
