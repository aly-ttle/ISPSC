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

    private function getStudentState(User $user)
    {
        $placement = Placement::where('student_id', $user->id)->first();
        $attendances = Attendance::where('student_id', $user->id)->orderBy('date', 'desc')->get();
        $tasks = Task::where('student_id', $user->id)->orderBy('created_at', 'desc')->get();
        $journals = Journal::where('student_id', $user->id)->orderBy('entry_date', 'desc')->get();
        $reports = AccomplishmentReport::where('student_id', $user->id)->orderBy('created_at', 'desc')->get();
        $feedbacks = Feedback::where('student_id', $user->id)->orderBy('created_at', 'desc')->get();
        $evaluations = Evaluation::where('student_id', $user->id)->orderBy('created_at', 'desc')->get();

        $defaultReqs = [
            'Memorandum of Agreement' => 'Required document',
            'Parent Consent Form' => 'Required document',
            'Weekly Accomplishment Report' => 'PDF or DOCX',
            'Medical Clearance Renewal' => 'Upload current copy',
        ];

        $dbReqs = Requirement::where('student_id', $user->id)->get()->keyBy('name');
        $requirements = [];
        foreach ($defaultReqs as $reqName => $meta) {
            $existing = $dbReqs->get($reqName);
            $requirements[] = [
                'name' => $reqName,
                'meta' => $meta,
                'status' => $existing ? $existing->status : 'Not submitted',
                'remarks' => $existing ? $existing->remarks : null,
            ];
        }

        $totalHours = (float) $attendances->where('status', 'Present')->sum('total_hours');
        $daysPresent = $attendances->where('status', 'Present')->count();
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
                'date' => Carbon::parse($a->date)->format('M j, D'),
                'schedule' => $a->schedule ?? 'Regular',
                'timeIn' => $a->time_in ?? '8:00 AM',
                'timeOut' => $a->time_out ?? '5:00 PM',
                'total' => number_format($a->total_hours, 0) . 'h 00m',
                'status' => $a->status,
            ];
        })->values()->all();

        $taskList = $tasks->map(function ($t) {
            return [
                'id' => $t->id,
                'title' => $t->title,
                'meta' => $t->meta ?? 'Task',
                'due' => $t->due_date ? Carbon::parse($t->due_date)->format('M d, Y') : '—',
                'done' => (bool) $t->is_completed,
            ];
        })->values()->all();

        $journalList = $journals->map(function ($j) {
            return [
                'id' => $j->id,
                'title' => $j->title,
                'reflection' => $j->reflection,
                'date' => Carbon::parse($j->entry_date)->format('M d, Y'),
                'hours' => $j->hours ?? '8 hours',
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
                'remarks' => $r->adviser_remarks,
            ];
        })->values()->all();

        return [
            'totalHours' => (int) $totalHours,
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
            'feedbacks' => $feedbacks,
            'evaluations' => $evaluations,
            'supervisorData' => [
                'students' => [],
            ],
        ];
    }

    private function getSupervisorState(User $user)
    {
        $students = User::where('role', 'student')->get();

        $studentList = $students->map(function ($s) {
            $placement = Placement::where('student_id', $s->id)->first();
            $attendances = Attendance::where('student_id', $s->id)->get();
            $hours = (float) $attendances->where('status', 'Present')->sum('total_hours');
            $latestTask = Task::where('student_id', $s->id)->latest()->first();
            $latestJournal = Journal::where('student_id', $s->id)->latest()->first();
            $latestReport = AccomplishmentReport::where('student_id', $s->id)->latest()->first();
            $latestAttendance = Attendance::where('student_id', $s->id)->latest()->first();
            $latestEval = Evaluation::where('student_id', $s->id)->latest()->first();
            $latestFeedback = Feedback::where('student_id', $s->id)->latest()->first();

            return [
                'id' => $s->id,
                'name' => $s->name,
                'program' => $s->department ?? 'BS Information Technology',
                'department' => $placement ? ($placement->department ?? 'Product Engineering') : 'Product Engineering',
                'company' => $placement ? $placement->company_name : 'Host Organization',
                'hours' => (int) $hours . ' / 480 hrs',
                'progress' => min(100, round(($hours / 480) * 100)) . '%',
                'status' => $placement ? $placement->status : 'Active',
                'evalStatus' => $latestEval ? $latestEval->status : 'Pending',
                'evalRating' => $latestEval ? $latestEval->rating : 0,
                'evalComments' => $latestEval ? $latestEval->comments : '',
                'feedbackStatus' => $latestFeedback ? 'Feedback given' : 'Pending',
                'feedbackRating' => $latestFeedback ? $latestFeedback->rating : 0,
                'feedbackNotes' => $latestFeedback ? $latestFeedback->notes : '',
                'journalTask' => $latestJournal ? $latestJournal->title : 'Daily reflection',
                'journalDate' => $latestJournal ? Carbon::parse($latestJournal->entry_date)->format('M d, Y') : '—',
                'journalStatus' => $latestJournal ? $latestJournal->status : 'Pending',
                'attendanceDate' => $latestAttendance ? Carbon::parse($latestAttendance->date)->format('M d, Y') : '—',
                'attendanceTimes' => $latestAttendance ? ($latestAttendance->time_in . ' - ' . $latestAttendance->time_out) : '—',
                'attendanceStatus' => $latestAttendance ? $latestAttendance->status : 'Pending',
                'taskTitle' => $latestTask ? $latestTask->title : '',
                'taskDue' => $latestTask && $latestTask->due_date ? Carbon::parse($latestTask->due_date)->format('M d, Y') : '—',
                'taskStatus' => $latestTask ? ($latestTask->is_completed ? 'Completed' : 'In progress') : 'Open',
                'reportTitle' => $latestReport ? $latestReport->title : '',
                'reportPeriod' => $latestReport ? ($latestReport->period ?? 'Current period') : '—',
                'reportStatus' => $latestReport ? $latestReport->status : 'Pending',
            ];
        })->values()->all();

        return [
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
            'reports' => [],
        ];
    }

    private function getAdviserState(User $user)
    {
        $students = User::where('role', 'student')->get();
        return [
            'students' => $students,
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

        $today = Carbon::today()->toDateString();
        $attendance = Attendance::firstOrCreate(
            ['student_id' => $user->id, 'date' => $today],
            [
                'schedule' => 'Regular',
                'time_in' => '8:00 AM',
                'time_out' => '5:00 PM',
                'total_hours' => 8.00,
                'status' => 'Present',
            ]
        );

        return response()->json([
            'success' => true,
            'message' => "Today's attendance has been recorded.",
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
            'message' => 'Application details submitted successfully.',
            'placement' => $placement,
        ]);
    }

    public function createTask(Request $request)
    {
        $user = Auth::user();
        if (!$user) return response()->json(['error' => 'Unauthenticated'], 401);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'due' => 'nullable|date',
            'student' => 'nullable|string',
            'details' => 'nullable|string',
        ]);

        $targetStudentId = $user->id;
        if (!empty($validated['student'])) {
            $studentObj = User::where('name', $validated['student'])->where('role', 'student')->first();
            if ($studentObj) {
                $targetStudentId = $studentObj->id;
            }
        }

        $task = Task::create([
            'student_id' => $targetStudentId,
            'assigned_by' => $user->id,
            'title' => $validated['title'],
            'due_date' => $validated['due'] ?? null,
            'details' => $validated['details'] ?? null,
            'meta' => $user->role === 'supervisor' ? 'Supervisor Assigned' : 'Personal task',
            'is_completed' => false,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Task saved successfully.',
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
        ]);

        $journal = Journal::create([
            'student_id' => $user->id,
            'title' => $validated['title'],
            'reflection' => $validated['reflection'],
            'entry_date' => Carbon::today()->toDateString(),
            'hours' => '8 hours',
            'status' => 'Submitted',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Journal entry saved successfully.',
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
            'period' => 'Current period',
            'status' => 'Draft',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Accomplishment report draft created.',
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
            ['status' => 'Approved', 'meta' => 'Required document']
        );

        return response()->json([
            'success' => true,
            'message' => 'Document uploaded successfully.',
            'requirement' => $req,
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

        $evaluation = Evaluation::updateOrCreate(
            ['student_id' => $student->id, 'period' => 'Midterm'],
            [
                'evaluator_id' => $user->id,
                'rating' => $validated['rating'],
                'comments' => $validated['comment'] ?? '',
                'status' => 'Completed',
            ]
        );

        return response()->json([
            'success' => true,
            'message' => "Evaluation score {$validated['rating']}/100 and comments saved for {$student->name}.",
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
            $latest = Attendance::where('student_id', $student->id)->latest()->first();
            if ($latest) {
                $latest->status = $request->input('decision') === 'Excused' ? 'Excused' : 'Present';
                $latest->remarks = $request->input('comments');
                $latest->save();
            }
        }

        return response()->json([
            'success' => true,
            'message' => "Attendance review saved for {$studentName}.",
        ]);
    }

    public function reviewJournal(Request $request)
    {
        $user = Auth::user();
        if (!$user) return response()->json(['error' => 'Unauthenticated'], 401);

        $studentName = $request->input('student');
        $student = User::where('name', $studentName)->where('role', 'student')->first();

        if ($student) {
            $latest = Journal::where('student_id', $student->id)->latest()->first();
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
                    'company_name' => $request->input('organization', 'Host Organization'),
                    'department' => $request->input('department', 'Product Engineering'),
                    'notes' => $request->input('notes'),
                    'status' => 'Active',
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
            'Department Supervisor' => 'supervisor',
            'OJT Adviser' => 'adviser',
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
            'email' => $username . '@ispsc.test',
            'role' => $roleKey,
            'password' => Hash::make('password123'),
        ]);

        return response()->json([
            'success' => true,
            'message' => "User {$newUser->name} (@{$newUser->username}) created successfully.",
            'user' => $newUser,
        ]);
    }
}
