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
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class PracticumController extends Controller
{
    public function getState(Request $request)
    {
        $user = Auth::user();
        if (!$user) {
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
        if ($r >= 97) return '1.00 (Outstanding / Excellent)';
        if ($r >= 94) return '1.25 (Very Superior)';
        if ($r >= 91) return '1.50 (Superior)';
        if ($r >= 88) return '1.75 (Very Good)';
        if ($r >= 85) return '2.00 (Good)';
        if ($r >= 80) return '2.25 (Satisfactory)';
        if ($r >= 75) return '2.50 – 3.00 (Passing)';
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
            'Campus Placement & Endorsement Form' => 'Required endorsement signed by Campus Department Head and Dean',
            'Parent Consent Form' => 'Notarized parent/guardian consent form',
            'Weekly Accomplishment Report' => 'Periodic synthesis report (PDF/DOCX)',
            'Medical Clearance Renewal' => 'Updated health certificate',
        ];

        $dbReqs = Requirement::where('student_id', $user->id)->get()->keyBy('name');
        $requirements = [];
        foreach ($defaultReqs as $reqName => $meta) {
            $existing = $dbReqs->get($reqName);
            if (!$existing && $reqName === 'Campus Placement & Endorsement Form') {
                $existing = $dbReqs->get('Memorandum of Agreement') ?? $dbReqs->get('Internal Department Endorsement & Acceptance');
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
        if ($placement) {
            $applicationData = [
                'id' => 'OJT-' . ($placement->period ?? '2026') . '-' . str_pad($placement->id, 4, '0', STR_PAD_LEFT),
                'dateSubmitted' => $placement->created_at->format('M d, Y'),
                'period' => $placement->period ?? 'AY 2025–2026',
                'company' => $placement->company_name,
                'department' => $placement->department ?? 'Unassigned',
                'supervisor' => $placement->supervisor_name ?? 'Unassigned',
                'supervisorEmail' => $placement->supervisor_email ?? '',
                'officeHours' => $placement->office_hours ?? '8:00 AM – 5:00 PM',
                'status' => $placement->status,
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
                'total' => $a->total_hours . ' hrs',
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
        // Trainees assigned to this supervisor / department
        $students = User::where('role', 'student')->get();
        $studentIds = $students->pluck('id');

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
                'department' => $placement ? ($placement->department ?? 'MIS / ICT Center') : 'MIS / ICT Center',
                'company' => $placement ? $placement->company_name : 'Campus Department / Office',
                'hours' => round($hours, 1) . ' / 480 hrs',
                'progress' => min(100, round(($hours / 480) * 100)) . '%',
                'status' => $placement ? $placement->status : 'Pending',
                'requirements' => "{$reqCount}/4 approved" . ($pendingReqCount > 0 ? " ({$pendingReqCount} pending)" : ""),
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
                'attendanceTimes' => $latestAttendance ? ($latestAttendance->time_in . ' – ' . $latestAttendance->time_out) : '—',
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
                    'total' => $a->total_hours . ' hrs',
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
                'hours' => round($hours, 1) . ' / 480 hrs',
                'progress' => min(100, round(($hours / 480) * 100)) . '%',
                'status' => $placement ? $placement->status : 'Pending',
                'requirements' => "{$reqCount}/4 approved" . ($pendingReqCount > 0 ? " ({$pendingReqCount} pending)" : ""),
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
                return [
                    'id' => $r->id,
                    'studentName' => $r->student ? $r->student->name : 'Student',
                    'studentProgram' => $r->student ? $r->student->department : '',
                    'name' => $r->name,
                    'meta' => $r->meta,
                    'submittedAt' => $r->updated_at->format('M d, Y h:i A'),
                ];
            })->values()->all();

        $reportsList = AccomplishmentReport::with('student')
            ->whereIn('student_id', $studentIds)
            ->latest()
            ->get()
            ->map(function ($rep) {
                return [
                    'id' => $rep->id,
                    'studentName' => $rep->student ? $rep->student->name : 'Student',
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
            'supervisors' => $supervisors->map(fn($sup) => ['id' => $sup->id, 'name' => $sup->name, 'department' => $sup->department, 'email' => $sup->email]),
            'pendingRequirements' => $pendingRequirements,
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
                'role' => match ($u->role) {
                    'supervisor' => 'Department Supervisor',
                    'adviser' => 'OJT Adviser',
                    'admin' => 'Portal Administrator',
                    default => 'OJT Student',
                },
                'roleKey' => $u->role,
                'department' => $u->department ?? 'General',
            ];
        });

        return [
            'allUsers' => $allUsers,
            'supervisorData' => [
                'students' => [],
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
        if (!$user) return response()->json(['error' => 'Unauthenticated'], 401);

        $date = $request->input('date', Carbon::today()->toDateString());
        $schedule = $request->input('schedule', 'Regular (8h)');
        $timeIn = $request->input('time_in', '8:00 AM');
        $timeOut = $request->input('time_out', '5:00 PM');
        $totalHours = (float) $request->input('total_hours', 8.00);
        $remarks = $request->input('remarks');

        // Create new entry to support multiple logs per day
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
        if (!$user) return response()->json(['error' => 'Unauthenticated'], 401);

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
            'message' => 'Placement details submitted successfully.',
            'placement' => $placement,
        ]);
    }

    public function assignStudent(Request $request)
    {
        $user = Auth::user();
        if (!$user || !in_array($user->role, ['adviser', 'admin'])) {
            return response()->json(['error' => 'Unauthorized. Only OJT Advisers can assign students to departments.'], 403);
        }

        $validated = $request->validate([
            'student' => 'required|string',
            'company_name' => 'required|string|max:255',
            'department' => 'required|string|max:255',
            'supervisor_name' => 'required|string|max:255',
            'supervisor_email' => 'nullable|email|max:255',
            'notes' => 'nullable|string',
        ]);

        $student = User::where('name', $validated['student'])->where('role', 'student')->first();
        if (!$student) {
            return response()->json(['error' => 'Student trainee not found.'], 404);
        }

        $placement = Placement::updateOrCreate(
            ['student_id' => $student->id],
            [
                'company_name' => $validated['company_name'],
                'department' => $validated['department'],
                'supervisor_name' => $validated['supervisor_name'],
                'supervisor_email' => $validated['supervisor_email'] ?? null,
                'notes' => $validated['notes'] ?? null,
                'status' => 'Pending', // Pending supervisor approval of documents
            ]
        );

        return response()->json([
            'success' => true,
            'message' => "{$student->name} assigned to {$validated['department']} ({$validated['company_name']}). Trainee must submit documents to Supervisor for final approval.",
            'placement' => $placement,
        ]);
    }

    public function approveStudent(Request $request)
    {
        $user = Auth::user();
        if (!$user || !in_array($user->role, ['supervisor', 'admin'])) {
            return response()->json(['error' => 'Unauthorized. Only Department Supervisors can approve trainees.'], 403);
        }

        $validated = $request->validate([
            'student' => 'required|string',
            'decision' => 'required|in:Active,Revision,Pending',
            'notes' => 'nullable|string',
        ]);

        $student = User::where('name', $validated['student'])->where('role', 'student')->first();
        if (!$student) {
            return response()->json(['error' => 'Student not found.'], 404);
        }

        $placement = Placement::where('student_id', $student->id)->first();
        if (!$placement) {
            $placement = Placement::create([
                'student_id' => $student->id,
                'company_name' => $user->department ?? 'Assigned Department',
                'department' => $user->department ?? 'General Unit',
                'supervisor_name' => $user->name,
                'supervisor_email' => $user->email,
                'status' => $validated['decision'],
                'notes' => $validated['notes'] ?? null,
            ]);
        } else {
            $placement->status = $validated['decision'];
            if ($validated['notes']) {
                $placement->notes = $validated['notes'];
            }
            $placement->save();
        }

        $decisionLabel = $validated['decision'] === 'Active' ? 'Approved & Activated for OJT' : $validated['decision'];

        return response()->json([
            'success' => true,
            'message' => "Student {$student->name} has been {$decisionLabel} by Department Supervisor.",
            'placement' => $placement,
        ]);
    }

    public function createTask(Request $request)
    {
        $user = Auth::user();
        if (!$user) return response()->json(['error' => 'Unauthenticated'], 401);

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

        $studentObj = User::where('name', $validated['student'])->where('role', 'student')->first();
        if (!$studentObj) {
            return response()->json(['error' => 'Student trainee not found.'], 404);
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
        if (!$user) return response()->json(['error' => 'Unauthenticated'], 401);

        $task = Task::where('id', $id)->first();
        if ($task) {
            $task->is_completed = $request->boolean('done');
            $task->save();
        }

        return response()->json(['success' => true]);
    }

    public function createJournal(Request $request)
    {
        $user = Auth::user();
        if (!$user) return response()->json(['error' => 'Unauthenticated'], 401);

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
            'status' => 'Pending review',
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
        if (!$user) return response()->json(['error' => 'Unauthenticated'], 401);

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
        if (!$user) return response()->json(['error' => 'Unauthenticated'], 401);

        $validated = $request->validate([
            'requirement' => 'required|string|max:255',
        ]);

        $req = Requirement::updateOrCreate(
            ['student_id' => $user->id, 'name' => $validated['requirement']],
            ['status' => 'Pending review', 'meta' => 'Submitted document for supervisor & adviser evaluation']
        );

        return response()->json([
            'success' => true,
            'message' => "Document '{$validated['requirement']}' uploaded. Status: Pending review by Department Supervisor / Adviser.",
            'requirement' => $req,
        ]);
    }

    public function reviewRequirement(Request $request)
    {
        $user = Auth::user();
        if (!$user || !in_array($user->role, ['supervisor', 'adviser', 'admin'])) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'student' => 'required|string',
            'requirement' => 'required|string',
            'decision' => 'required|in:Approved,Revision,Pending review',
            'comments' => 'nullable|string',
        ]);

        $student = User::where('name', $validated['student'])->where('role', 'student')->first();
        if (!$student) return response()->json(['error' => 'Student not found'], 404);

        $req = Requirement::where('student_id', $student->id)
            ->where('name', $validated['requirement'])
            ->first();

        if ($req) {
            $req->status = $validated['decision'];
            $req->remarks = $validated['comments'];
            $req->save();
        } else {
            $req = Requirement::create([
                'student_id' => $student->id,
                'name' => $validated['requirement'],
                'status' => $validated['decision'],
                'remarks' => $validated['comments'],
                'meta' => "Evaluated by {$user->name} ({$user->role})",
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => "Document '{$validated['requirement']}' evaluated as '{$validated['decision']}' for {$student->name}.",
        ]);
    }

    public function reviewReport(Request $request)
    {
        return $this->reviewAccomplishmentReport($request);
    }

    public function reviewAccomplishmentReport(Request $request)
    {
        $user = Auth::user();
        if (!$user || !in_array($user->role, ['supervisor', 'adviser', 'admin'])) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'student' => 'required|string',
            'decision' => 'required|in:Approved,Revision',
            'comments' => 'nullable|string',
        ]);

        $student = User::where('name', $validated['student'])->where('role', 'student')->first();
        if (!$student) return response()->json(['error' => 'Student not found'], 404);

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
        if (!$user) return response()->json(['error' => 'Unauthenticated'], 401);

        $validated = $request->validate([
            'student' => 'required|string',
            'rating' => 'required|numeric|min:1|max:100',
            'comment' => 'nullable|string',
        ]);

        $student = User::where('name', $validated['student'])->where('role', 'student')->first();
        if (!$student) {
            return response()->json(['error' => 'Student not found'], 404);
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
        if (!$user) return response()->json(['error' => 'Unauthenticated'], 401);

        $validated = $request->validate([
            'student' => 'required|string',
            'rating' => 'required|numeric|min:1|max:100',
            'feedback' => 'nullable|string',
        ]);

        $student = User::where('name', $validated['student'])->where('role', 'student')->first();
        if (!$student) {
            return response()->json(['error' => 'Student not found'], 404);
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
        if (!$user) return response()->json(['error' => 'Unauthenticated'], 401);

        $studentName = $request->input('student');
        $student = User::where('name', $studentName)->where('role', 'student')->first();

        if ($student) {
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
        if (!$user) return response()->json(['error' => 'Unauthenticated'], 401);

        $studentName = $request->input('student');
        $student = User::where('name', $studentName)->where('role', 'student')->first();

        if ($student) {
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
        if (!$user) return response()->json(['error' => 'Unauthenticated'], 401);

        $studentName = $request->input('student');
        $student = User::where('name', $studentName)->where('role', 'student')->first();

        if ($student) {
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

    public function adminAddUser(Request $request)
    {
        $user = Auth::user();
        if (!$user || $user->role !== 'admin') {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'role' => 'required|string',
        ]);

        $roleKey = match ($validated['role']) {
            'supervisor' => 'supervisor',
            'adviser' => 'adviser',
            'admin' => 'admin',
            default => 'student',
        };

        $baseUsername = strtolower(preg_replace('/[^a-zA-Z0-9]/', '', $validated['name']));
        $username = $baseUsername ?: 'user' . rand(100, 999);
        $counter = 1;
        while (User::where('username', $username)->exists()) {
            $username = $baseUsername . $counter;
            $counter++;
        }

        $newUser = User::create([
            'name' => $validated['name'],
            'username' => $username,
            'email' => $username . '@ispsc.edu.ph',
            'role' => $roleKey,
            'password' => Hash::make('ispsc1234'),
        ]);

        return response()->json([
            'success' => true,
            'message' => "User {$newUser->name} (@{$newUser->username}) created successfully.",
            'user' => $newUser,
        ]);
    }
}
