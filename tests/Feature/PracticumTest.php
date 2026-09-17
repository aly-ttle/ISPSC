<?php

namespace Tests\Feature;

use App\Models\AccomplishmentReport;
use App\Models\Attendance;
use App\Models\Journal;
use App\Models\Requirement;
use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class PracticumTest extends TestCase
{
    use RefreshDatabase;

    protected $student;
    protected $supervisor;
    protected $adviser;
    protected $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->student = User::create([
            'name' => 'Juan Dela Cruz',
            'username' => 'student',
            'email' => 'student@ispsc.edu.ph',
            'role' => 'student',
            'department' => 'BS Information Technology',
            'password' => Hash::make('ispsc1234'),
        ]);

        $this->supervisor = User::create([
            'name' => 'Engr. Roberto Gomez',
            'username' => 'supervisor',
            'email' => 'supervisor@ispsc.edu.ph',
            'role' => 'supervisor',
            'department' => 'Management Information Systems (MIS) / ICT Center',
            'password' => Hash::make('ispsc1234'),
        ]);

        $this->adviser = User::create([
            'name' => 'Prof. Maria Elena Santos',
            'username' => 'adviser',
            'email' => 'adviser@ispsc.edu.ph',
            'role' => 'adviser',
            'department' => 'College of Computing Studies',
            'password' => Hash::make('ispsc1234'),
        ]);

        $this->admin = User::create([
            'name' => 'System Administrator',
            'username' => 'admin',
            'email' => 'admin@ispsc.edu.ph',
            'role' => 'admin',
            'department' => 'Management Information Systems',
            'password' => Hash::make('ispsc1234'),
        ]);
    }

    public function test_auth_login_successful(): void
    {
        $response = $this->postJson('/auth/login', [
            'username' => 'student',
            'password' => 'ispsc1234',
        ]);

        $response->assertStatus(200)
            ->assertJson(['success' => true])
            ->assertJsonPath('user.username', 'student');
    }

    public function test_student_can_fetch_state(): void
    {
        $this->actingAs($this->student);

        $response = $this->getJson('/practicum/state');
        $response->assertStatus(200)
            ->assertJsonStructure(['totalHours', 'attendanceLogs', 'requirements', 'tasks']);
    }

    public function test_student_can_record_attendance(): void
    {
        $this->actingAs($this->student);

        $response = $this->postJson('/practicum/attendance', [
            'date' => '2026-09-16',
            'schedule' => 'Regular (8h)',
            'time_in' => '8:00 AM',
            'time_out' => '5:00 PM',
            'total_hours' => 8,
            'remarks' => 'Completed onboarding tasks',
        ]);

        $response->assertStatus(200)->assertJson(['success' => true]);
        $this->assertDatabaseHas('attendances', [
            'student_id' => $this->student->id,
            'date' => '2026-09-16',
            'total_hours' => 8,
        ]);
    }

    public function test_student_cannot_create_task_themselves(): void
    {
        $this->actingAs($this->student);

        $response = $this->postJson('/practicum/task', [
            'title' => 'Self created task',
            'student' => $this->student->name,
        ]);

        $response->assertStatus(403);
    }

    public function test_supervisor_can_assign_task_to_student_and_student_can_toggle(): void
    {
        // Supervisor assigns task
        $this->actingAs($this->supervisor);

        $response = $this->postJson('/practicum/task', [
            'title' => 'Audit Campus WiFi Access Points',
            'student' => $this->student->name,
            'due' => '2026-09-20',
            'details' => 'Check signal levels in Building A and B.',
        ]);

        $response->assertStatus(200)->assertJson(['success' => true]);
        $this->assertDatabaseHas('tasks', [
            'student_id' => $this->student->id,
            'assigned_by' => $this->supervisor->id,
            'title' => 'Audit Campus WiFi Access Points',
            'is_completed' => false,
        ]);

        $task = Task::where('student_id', $this->student->id)->latest()->first();

        // Student marks task complete
        $this->actingAs($this->student);
        $toggleRes = $this->postJson("/practicum/task/{$task->id}/toggle", [
            'done' => true,
        ]);

        $toggleRes->assertStatus(200)->assertJson(['success' => true]);
        $this->assertDatabaseHas('tasks', [
            'id' => $task->id,
            'is_completed' => true,
        ]);
    }

    public function test_student_can_create_and_adviser_review_report(): void
    {
        $this->actingAs($this->student);

        $response = $this->postJson('/practicum/report', [
            'week' => 'Week 1 Accomplishments',
            'summary' => 'Finished database schema setup and initial tests.',
        ]);

        $response->assertStatus(200)->assertJson(['success' => true]);

        // Review as Adviser
        $this->actingAs($this->adviser);
        $reviewRes = $this->postJson('/practicum/review-report', [
            'student' => $this->student->name,
            'decision' => 'Approved',
            'comments' => 'Excellent work on the report.',
        ]);

        $reviewRes->assertStatus(200)->assertJson(['success' => true]);
        $this->assertDatabaseHas('accomplishment_reports', [
            'student_id' => $this->student->id,
            'status' => 'Approved',
            'adviser_remarks' => 'Excellent work on the report.',
        ]);
    }

    public function test_student_requirement_upload_and_review(): void
    {
        $this->actingAs($this->student);

        $this->postJson('/practicum/requirement', [
            'requirement' => 'Campus Placement & Endorsement Form',
        ])->assertStatus(200);

        // Adviser review
        $this->actingAs($this->adviser);
        $this->postJson('/practicum/review-requirement', [
            'student' => $this->student->name,
            'requirement' => 'Campus Placement & Endorsement Form',
            'decision' => 'Approved',
            'comments' => 'Document signed and valid.',
        ])->assertStatus(200);

        $this->assertDatabaseHas('requirements', [
            'student_id' => $this->student->id,
            'name' => 'Campus Placement & Endorsement Form',
            'status' => 'Approved',
        ]);
    }

    public function test_supervisor_evaluation_and_feedback(): void
    {
        $this->actingAs($this->supervisor);

        $this->postJson('/practicum/evaluation', [
            'student' => $this->student->name,
            'rating' => 95,
            'comment' => 'Outstanding performance and diligence.',
        ])->assertStatus(200);

        $this->postJson('/practicum/feedback', [
            'student' => $this->student->name,
            'rating' => 92,
            'feedback' => 'Keep up the proactive communication.',
        ])->assertStatus(200);

        $this->assertDatabaseHas('evaluations', [
            'student_id' => $this->student->id,
            'rating' => 95,
        ]);
        $this->assertDatabaseHas('feedback', [
            'student_id' => $this->student->id,
            'rating' => 92,
        ]);
    }

    public function test_admin_can_create_new_user(): void
    {
        $this->actingAs($this->admin);

        $response = $this->postJson('/practicum/admin/user', [
            'name' => 'Dr. Carlo Reyes',
            'role' => 'adviser',
        ]);

        $response->assertStatus(200)->assertJson(['success' => true]);
        $this->assertDatabaseHas('users', [
            'name' => 'Dr. Carlo Reyes',
            'role' => 'adviser',
        ]);
    }
}
