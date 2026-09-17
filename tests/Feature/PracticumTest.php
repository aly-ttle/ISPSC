<?php

namespace Tests\Feature;

use App\Mail\ResetPasswordMail;
use App\Models\Placement;
use App\Models\Requirement;
use App\Models\Task;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class PracticumTest extends TestCase
{
    use RefreshDatabase;

    protected $studentMIS;

    protected $studentReg;

    protected $supervisorMIS;

    protected $supervisorReg;

    protected $adviser;

    protected $admin;

    protected function setUp(): void
    {
        parent::setUp();

        // 1. MIS Supervisor & Student
        $this->supervisorMIS = User::create([
            'name' => 'Engr. Roberto Gomez',
            'username' => 'supervisor',
            'email' => 'supervisor@ispsc.edu.ph',
            'role' => 'supervisor',
            'department' => 'Management Information Systems (MIS) / ICT Center',
            'password' => Hash::make('ispsc1234'),
        ]);

        $this->studentMIS = User::create([
            'name' => 'Juan Dela Cruz',
            'username' => 'student',
            'email' => 'student@ispsc.edu.ph',
            'role' => 'student',
            'department' => 'BS Information Technology',
            'password' => Hash::make('ispsc1234'),
        ]);

        Placement::create([
            'student_id' => $this->studentMIS->id,
            'supervisor_id' => $this->supervisorMIS->id,
            'company_name' => 'Management Information Systems (MIS) / ICT Center',
            'department' => 'Network Administration & Systems Development Unit',
            'supervisor_name' => $this->supervisorMIS->name,
            'supervisor_email' => $this->supervisorMIS->email,
            'status' => 'Active',
        ]);

        // 2. Registrar Supervisor & Student
        $this->supervisorReg = User::create([
            'name' => 'Mrs. Alicia Mendoza',
            'username' => 'registrar',
            'email' => 'registrar@ispsc.edu.ph',
            'role' => 'supervisor',
            'department' => 'Office of the Campus Registrar',
            'password' => Hash::make('ispsc1234'),
        ]);

        $this->studentReg = User::create([
            'name' => 'Maria Santos',
            'username' => 'student2',
            'email' => 'maria@ispsc.edu.ph',
            'role' => 'student',
            'department' => 'BS Information Technology',
            'password' => Hash::make('ispsc1234'),
        ]);

        Placement::create([
            'student_id' => $this->studentReg->id,
            'supervisor_id' => $this->supervisorReg->id,
            'company_name' => 'Office of the Campus Registrar',
            'department' => 'Records Section',
            'supervisor_name' => $this->supervisorReg->name,
            'supervisor_email' => $this->supervisorReg->email,
            'status' => 'Active',
        ]);

        // 3. Adviser & Admin
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

    public static function registrationRoles(): array
    {
        return [
            'student' => ['student'],
            'adviser' => ['adviser'],
            'supervisor' => ['supervisor'],
        ];
    }

    #[DataProvider('registrationRoles')]
    public function test_registered_users_can_log_out_and_log_back_in(string $role): void
    {
        $username = 'new_'.$role;
        $password = 'PortalPass123';

        $registration = $this->postJson('/auth/register', [
            'name' => ucfirst($role).' Test User',
            'id_number' => strtoupper($role).'001',
            'role' => $role,
            'department' => 'College of Computing Studies',
            'email' => $username.'@ispsc.edu.ph',
            'username' => $username,
            'password' => $password,
        ]);

        $registration->assertOk()
            ->assertJson(['success' => true])
            ->assertJsonPath('user.role', $role);
        $this->assertDatabaseHas('users', ['username' => $username, 'role' => $role]);
        $this->assertTrue(Hash::check($password, User::where('username', $username)->value('password')));

        $this->postJson('/auth/logout')->assertOk();

        $login = $this->postJson('/auth/login', [
            'username' => strtoupper($username),
            'password' => $password,
        ]);

        $login->assertOk()
            ->assertJson(['success' => true])
            ->assertJsonPath('user.username', $username)
            ->assertJsonPath('user.role', $role);
    }

    public function test_student_can_fetch_state(): void
    {
        $this->actingAs($this->studentMIS);

        $response = $this->getJson('/practicum/state');
        $response->assertStatus(200)
            ->assertJsonStructure(['totalHours', 'attendanceLogs', 'requirements', 'tasks']);
    }

    public function test_supervisor_can_only_see_students_in_their_own_department(): void
    {
        // 1. MIS Supervisor should only see MIS student
        $this->actingAs($this->supervisorMIS);
        $response = $this->getJson('/practicum/state');
        $response->assertStatus(200);

        $students = $response->json('students');
        $this->assertCount(1, $students);
        $this->assertEquals('Juan Dela Cruz', $students[0]['name']);
        $this->assertEquals('Management Information Systems (MIS) / ICT Center', $students[0]['company']);

        // 2. Registrar Supervisor should only see Registrar student
        $this->actingAs($this->supervisorReg);
        $responseReg = $this->getJson('/practicum/state');
        $responseReg->assertStatus(200);

        $studentsReg = $responseReg->json('students');
        $this->assertCount(1, $studentsReg);
        $this->assertEquals('Maria Santos', $studentsReg[0]['name']);
        $this->assertEquals('Office of the Campus Registrar', $studentsReg[0]['company']);
    }

    public function test_supervisor_cannot_assign_task_to_student_in_another_department(): void
    {
        // MIS supervisor tries to assign task to Registrar's student
        $this->actingAs($this->supervisorMIS);

        $response = $this->postJson('/practicum/task', [
            'title' => 'Cross-department task',
            'student' => $this->studentReg->name,
        ]);

        $response->assertStatus(403);
        $this->assertDatabaseMissing('tasks', [
            'title' => 'Cross-department task',
            'student_id' => $this->studentReg->id,
        ]);
    }

    public function test_supervisor_cannot_evaluate_student_in_another_department(): void
    {
        // Registrar supervisor tries to evaluate MIS student
        $this->actingAs($this->supervisorReg);

        $response = $this->postJson('/practicum/evaluation', [
            'student' => $this->studentMIS->name,
            'rating' => 95,
            'comment' => 'Illegal appraisal attempt',
        ]);

        $response->assertStatus(403);
    }

    public function test_supervisor_can_assign_task_to_their_department_student(): void
    {
        $this->actingAs($this->supervisorMIS);

        $response = $this->postJson('/practicum/task', [
            'title' => 'Audit Campus WiFi Access Points',
            'student' => $this->studentMIS->name,
            'due' => '2026-09-20',
            'details' => 'Check signal levels in Building A and B.',
        ]);

        $response->assertStatus(200)->assertJson(['success' => true]);
        $this->assertDatabaseHas('tasks', [
            'student_id' => $this->studentMIS->id,
            'assigned_by' => $this->supervisorMIS->id,
            'title' => 'Audit Campus WiFi Access Points',
            'is_completed' => false,
        ]);

        $task = Task::where('student_id', $this->studentMIS->id)->latest()->first();

        // Student marks task complete
        $this->actingAs($this->studentMIS);
        $toggleRes = $this->postJson("/practicum/task/{$task->id}/toggle", [
            'done' => true,
        ]);

        $toggleRes->assertStatus(200)->assertJson(['success' => true]);
        $this->assertDatabaseHas('tasks', [
            'id' => $task->id,
            'is_completed' => true,
        ]);
    }

    public function test_adviser_can_assign_new_student_to_department(): void
    {
        $newStudent = User::create([
            'name' => 'Alex Rivera',
            'username' => 'alex',
            'email' => 'alex@ispsc.edu.ph',
            'role' => 'student',
            'department' => 'BS Computer Science',
            'password' => Hash::make('ispsc1234'),
        ]);

        $this->actingAs($this->adviser);

        $response = $this->postJson('/practicum/assign-student', [
            'student' => $newStudent->name,
            'company_name' => 'Management Information Systems (MIS) / ICT Center',
            'department' => 'Network Unit',
            'supervisor_name' => $this->supervisorMIS->name,
            'supervisor_email' => $this->supervisorMIS->email,
        ]);

        $response->assertStatus(200)->assertJson(['success' => true]);

        // Now MIS supervisor should see 2 students
        $this->actingAs($this->supervisorMIS);
        $stateRes = $this->getJson('/practicum/state');
        $this->assertCount(2, $stateRes->json('students'));
    }

    public function test_adviser_cannot_assign_a_cross_department_supervisor(): void
    {
        $newStudent = User::create([
            'name' => 'Alex Rivera',
            'username' => 'alex',
            'email' => 'alex@ispsc.edu.ph',
            'role' => 'student',
            'department' => 'BS Computer Science',
            'password' => Hash::make('ispsc1234'),
        ]);

        $this->actingAs($this->adviser);

        $response = $this->postJson('/practicum/assign-student', [
            'student' => $newStudent->name,
            'company_name' => 'Management Information Systems (MIS) / ICT Center',
            'department' => 'Network Unit',
            'supervisor_name' => $this->supervisorReg->name,
            'supervisor_email' => $this->supervisorReg->email,
        ]);

        $response->assertUnprocessable();
        $this->assertDatabaseMissing('placements', [
            'student_id' => $newStudent->id,
        ]);
    }

    public function test_student_can_record_attendance(): void
    {
        $this->actingAs($this->studentMIS);

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
            'student_id' => $this->studentMIS->id,
            'date' => '2026-09-16',
            'total_hours' => 8,
        ]);
    }

    public function test_student_can_create_a_journal_for_supervisor_review(): void
    {
        $this->actingAs($this->studentMIS);

        $response = $this->postJson('/practicum/journal', [
            'title' => 'Daily network support reflection',
            'reflection' => 'Documented the troubleshooting steps completed during the shift.',
            'hours' => '8 hours rendered',
        ]);

        $response->assertOk()->assertJson(['success' => true]);
        $this->assertDatabaseHas('journals', [
            'student_id' => $this->studentMIS->id,
            'title' => 'Daily network support reflection',
            'status' => 'Submitted',
        ]);
    }

    public function test_supervisor_can_approve_an_assigned_student(): void
    {
        $this->actingAs($this->supervisorMIS);

        $response = $this->postJson('/practicum/approve-student', [
            'student' => $this->studentMIS->name,
            'decision' => 'Approved',
            'notes' => 'Placement documents verified.',
        ]);

        $response->assertOk()->assertJson(['success' => true]);
        $this->assertDatabaseHas('placements', [
            'student_id' => $this->studentMIS->id,
            'status' => 'Active',
            'notes' => 'Placement documents verified.',
        ]);
    }

    public function test_student_cannot_create_task_themselves(): void
    {
        $this->actingAs($this->studentMIS);

        $response = $this->postJson('/practicum/task', [
            'title' => 'Self created task',
            'student' => $this->studentMIS->name,
        ]);

        $response->assertStatus(403);
    }

    public function test_student_can_create_and_adviser_review_report(): void
    {
        $this->actingAs($this->studentMIS);

        $response = $this->postJson('/practicum/report', [
            'week' => 'Week 1 Accomplishments',
            'summary' => 'Finished database schema setup and initial tests.',
        ]);

        $response->assertStatus(200)->assertJson(['success' => true]);

        // Review as Adviser
        $this->actingAs($this->adviser);
        $reviewRes = $this->postJson('/practicum/review-report', [
            'student' => $this->studentMIS->name,
            'decision' => 'Approved',
            'comments' => 'Excellent work on the report.',
        ]);

        $reviewRes->assertStatus(200)->assertJson(['success' => true]);
        $this->assertDatabaseHas('accomplishment_reports', [
            'student_id' => $this->studentMIS->id,
            'status' => 'Approved',
            'adviser_remarks' => 'Excellent work on the report.',
        ]);
    }

    public function test_student_requirement_upload_and_review(): void
    {
        $this->actingAs($this->studentMIS);

        $this->post('/practicum/requirement', [
            'requirement' => 'Campus Placement & Endorsement Form',
            'file' => UploadedFile::fake()->create('endorsement.pdf', 100, 'application/pdf'),
        ])->assertStatus(200);

        // Adviser review
        $this->actingAs($this->adviser);
        $this->postJson('/practicum/review-requirement', [
            'student' => $this->studentMIS->name,
            'requirement' => 'Campus Placement & Endorsement Form',
            'decision' => 'Approved',
            'comments' => 'Document signed and valid.',
        ])->assertStatus(200);

        $this->assertDatabaseHas('requirements', [
            'student_id' => $this->studentMIS->id,
            'name' => 'Campus Placement & Endorsement Form',
            'status' => 'Approved',
        ]);

        $requirement = Requirement::where('student_id', $this->studentMIS->id)->first();
        $this->actingAs($this->adviser);
        $previewResponse = $this->get('/practicum/requirements/'.$requirement->id.'/preview');
        $previewResponse->assertOk();
        $this->assertStringStartsWith('inline; filename="', $previewResponse->headers->get('Content-Disposition'));
    }

    public function test_supervisor_evaluation_and_feedback(): void
    {
        $this->actingAs($this->supervisorMIS);

        $this->postJson('/practicum/evaluation', [
            'student' => $this->studentMIS->name,
            'rating' => 95,
            'comment' => 'Outstanding performance and diligence.',
        ])->assertStatus(200);

        $this->postJson('/practicum/feedback', [
            'student' => $this->studentMIS->name,
            'rating' => 92,
            'feedback' => 'Keep up the proactive communication.',
        ])->assertStatus(200);

        $this->assertDatabaseHas('evaluations', [
            'student_id' => $this->studentMIS->id,
            'rating' => 95,
        ]);
        $this->assertDatabaseHas('feedback', [
            'student_id' => $this->studentMIS->id,
            'rating' => 92,
        ]);
    }

    public function test_admin_can_assign_role_to_existing_department_supervisor(): void
    {
        $this->actingAs($this->admin);

        $response = $this->postJson('/practicum/admin/assign-role', [
            'supervisor_id' => $this->supervisorMIS->id,
            'role' => 'adviser',
            'department' => 'College of Computing Studies',
        ]);

        $response->assertStatus(200)->assertJson(['success' => true]);
        $this->assertDatabaseHas('users', [
            'id' => $this->supervisorMIS->id,
            'role' => 'adviser',
            'department' => 'College of Computing Studies',
        ]);
    }

    public function test_admin_cannot_assign_role_to_non_supervisor_users(): void
    {
        $this->actingAs($this->admin);

        // Attempt to assign role to a student
        $response = $this->postJson('/practicum/admin/assign-role', [
            'user_id' => $this->studentMIS->id,
            'role' => 'supervisor',
            'department' => 'Management Information Systems',
        ]);

        $response->assertStatus(403);
        $this->assertDatabaseHas('users', [
            'id' => $this->studentMIS->id,
            'role' => 'student',
        ]);
    }

    public function test_non_admin_cannot_assign_roles(): void
    {
        $this->actingAs($this->adviser);

        $response = $this->postJson('/practicum/admin/assign-role', [
            'supervisor_id' => $this->supervisorMIS->id,
            'role' => 'admin',
        ]);

        $response->assertStatus(403);
    }

    public function test_public_registration_cannot_create_a_privileged_account(): void
    {
        $response = $this->postJson('/auth/register', [
            'name' => 'Untrusted Admin',
            'role' => 'admin',
            'email' => 'untrusted-admin@ispsc.edu.ph',
            'username' => 'untrusted-admin',
            'password' => 'secret123',
        ]);

        $response->assertOk();
        $this->assertDatabaseHas('users', [
            'username' => 'untrusted-admin',
            'role' => 'student',
        ]);
    }

    public function test_public_registration_allows_selected_non_student_roles(): void
    {
        $this->postJson('/auth/register', [
            'name' => 'Adviser User',
            'id_number' => 'ADV-9001',
            'role' => 'adviser',
            'department' => 'College of Computing Studies',
            'email' => 'adviser-user@ispsc.edu.ph',
            'username' => 'adviseruser',
            'password' => 'secret123',
        ])->assertOk();

        $this->assertDatabaseHas('users', [
            'username' => 'adviseruser',
            'role' => 'adviser',
        ]);

        $this->postJson('/auth/register', [
            'name' => 'Supervisor User',
            'id_number' => 'SUP-9002',
            'role' => 'supervisor',
            'department' => 'Management Information Systems (MIS) / ICT Center',
            'email' => 'supervisor-user@ispsc.edu.ph',
            'username' => 'supervisoruser',
            'password' => 'secret123',
        ])->assertOk();

        $this->assertDatabaseHas('users', [
            'username' => 'supervisoruser',
            'role' => 'supervisor',
        ]);
    }

    public function test_student_cannot_update_another_students_task(): void
    {
        $task = Task::create([
            'student_id' => $this->studentReg->id,
            'assigned_by' => $this->supervisorReg->id,
            'title' => 'Registrar task',
            'is_completed' => false,
        ]);

        $this->actingAs($this->studentMIS);

        $response = $this->postJson('/practicum/task/'.$task->id.'/toggle', ['done' => true]);

        $response->assertForbidden();
        $this->assertDatabaseHas('tasks', [
            'id' => $task->id,
            'is_completed' => false,
        ]);
    }

    public function test_students_cannot_review_or_submit_staff_records(): void
    {
        $this->actingAs($this->studentMIS);

        $this->postJson('/practicum/evaluation', [
            'student' => $this->studentReg->name,
            'rating' => 95,
        ])->assertForbidden();

        $this->postJson('/practicum/feedback', [
            'student' => $this->studentReg->name,
            'rating' => 95,
        ])->assertForbidden();

        $this->postJson('/practicum/review-attendance', [
            'student' => $this->studentReg->name,
            'decision' => 'Approved',
        ])->assertForbidden();

        $this->postJson('/practicum/review-journal', [
            'student' => $this->studentReg->name,
            'decision' => 'Approved',
        ])->assertForbidden();
    }

    public function test_students_cannot_update_placements_or_staff_records(): void
    {
        $this->actingAs($this->studentMIS);

        $this->postJson('/practicum/update-placement', [
            'student' => $this->studentReg->name,
            'organization' => 'Unauthorized Office',
        ])->assertForbidden();

        $this->actingAs($this->supervisorMIS);

        $this->postJson('/practicum/journal', [
            'title' => 'Supervisor journal',
            'reflection' => 'Should not be accepted.',
        ])->assertForbidden();

        $this->postJson('/practicum/attendance', [
            'date' => '2026-09-17',
        ])->assertForbidden();
    }

    public function test_user_registration(): void
    {
        $response = $this->postJson('/auth/register', [
            'name' => 'Maria Santos',
            'id_number' => '2026-TG-0099',
            'role' => 'student',
            'department' => 'BS Information Technology',
            'email' => 'maria.santos@ispsc.edu.ph',
            'username' => 'mariasantos',
            'password' => 'secret123',
        ]);

        $response->assertStatus(200)->assertJson(['success' => true]);
        $this->assertDatabaseHas('users', [
            'username' => 'mariasantos',
            'email' => 'maria.santos@ispsc.edu.ph',
            'role' => 'student',
        ]);
    }

    public function test_user_registration_fails_if_email_is_invalid(): void
    {
        $response = $this->postJson('/auth/register', [
            'name' => 'Maria Santos',
            'id_number' => '2026-TG-0099',
            'role' => 'student',
            'department' => 'BS Information Technology',
            'email' => 'invalid-email-address',
            'username' => 'mariasantos',
            'password' => 'secret123',
        ]);

        $response->assertStatus(422);
        $this->assertDatabaseMissing('users', [
            'username' => 'mariasantos',
        ]);
    }

    public function test_forgot_password_generates_token_and_reset_link(): void
    {
        Mail::fake();

        $response = $this->postJson('/auth/forgot-password', [
            'email' => 'student@ispsc.edu.ph',
        ]);

        $response->assertStatus(200)
            ->assertJson(['success' => true])
            ->assertJsonPath('expires_in_minutes', 15)
            ->assertJsonMissingPath('reset_link');

        $this->assertDatabaseHas('password_reset_tokens', [
            'email' => 'student@ispsc.edu.ph',
        ]);

        // Assert reset password email was dispatched to student
        Mail::assertSent(ResetPasswordMail::class, function ($mail) {
            return $mail->hasTo('student@ispsc.edu.ph') &&
                   str_contains($mail->resetUrl, 'action=reset-password') &&
                   $mail->expiresInMinutes === 15;
        });
    }

    public function test_forgot_password_does_not_reveal_unknown_email(): void
    {
        $response = $this->postJson('/auth/forgot-password', [
            'email' => 'unknown.student@ispsc.edu.ph',
        ]);

        $response->assertStatus(200)
            ->assertJson(['success' => true])
            ->assertJsonPath('email', 'unknown.student@ispsc.edu.ph');
    }

    public function test_reset_password_succeeds_with_valid_token_and_password_policy(): void
    {
        // 1. Request reset link
        $forgotRes = $this->postJson('/auth/forgot-password', [
            'email' => 'student@ispsc.edu.ph',
        ]);
        $forgotRes->assertStatus(200);
        $otp = cache()->get('reset_otp_student@ispsc.edu.ph')['otp'];
        $verifyRes = $this->postJson('/auth/verify-otp', [
            'email' => 'student@ispsc.edu.ph',
            'otp' => $otp,
        ]);
        $token = $verifyRes->json('token');

        // 2. Submit new valid password (minimum 8 characters, letters & digits)
        $resetRes = $this->postJson('/auth/reset-password', [
            'email' => 'student@ispsc.edu.ph',
            'token' => $token,
            'password' => 'NewSecurePass2026',
            'password_confirmation' => 'NewSecurePass2026',
        ]);

        $resetRes->assertStatus(200)->assertJson(['success' => true]);

        // 3. Verify user can now log in with new password
        $loginRes = $this->postJson('/auth/login', [
            'username' => 'student',
            'password' => 'NewSecurePass2026',
        ]);
        $loginRes->assertStatus(200)->assertJson(['success' => true]);

        // 4. Verify token was cleared from table
        $this->assertDatabaseMissing('password_reset_tokens', [
            'email' => 'student@ispsc.edu.ph',
        ]);
    }

    public function test_reset_password_fails_if_password_does_not_meet_rules(): void
    {
        $forgotRes = $this->postJson('/auth/forgot-password', [
            'email' => 'student@ispsc.edu.ph',
        ]);
        $otp = cache()->get('reset_otp_student@ispsc.edu.ph')['otp'];
        $verifyRes = $this->postJson('/auth/verify-otp', [
            'email' => 'student@ispsc.edu.ph',
            'otp' => $otp,
        ]);
        $token = $verifyRes->json('token');

        // Fails: less than 8 characters
        $responseTooShort = $this->postJson('/auth/reset-password', [
            'email' => 'student@ispsc.edu.ph',
            'token' => $token,
            'password' => 'pass1',
            'password_confirmation' => 'pass1',
        ]);
        $responseTooShort->assertStatus(422);

        // Fails: no numbers (letters only)
        $responseLettersOnly = $this->postJson('/auth/reset-password', [
            'email' => 'student@ispsc.edu.ph',
            'token' => $token,
            'password' => 'onlyletterspass',
            'password_confirmation' => 'onlyletterspass',
        ]);
        $responseLettersOnly->assertStatus(422);

        // Fails: no letters (digits only)
        $responseNumbersOnly = $this->postJson('/auth/reset-password', [
            'email' => 'student@ispsc.edu.ph',
            'token' => $token,
            'password' => '1234567890',
            'password_confirmation' => '1234567890',
        ]);
        $responseNumbersOnly->assertStatus(422);
    }

    public function test_verify_otp_succeeds_with_correct_otp(): void
    {
        Mail::fake();
        $forgotRes = $this->postJson('/auth/forgot-password', [
            'email' => 'student@ispsc.edu.ph',
        ]);
        $forgotRes->assertStatus(200);

        // Retrieve OTP from cache
        $cached = cache()->get('reset_otp_student@ispsc.edu.ph');
        $this->assertNotNull($cached);
        $otp = $cached['otp'];

        // 1. Verification succeeds
        $verifyRes = $this->postJson('/auth/verify-otp', [
            'email' => 'student@ispsc.edu.ph',
            'otp' => $otp,
        ]);
        $verifyRes->assertStatus(200)->assertJson(['success' => true]);

        // 2. Verification fails with wrong OTP
        $failRes = $this->postJson('/auth/verify-otp', [
            'email' => 'student@ispsc.edu.ph',
            'otp' => '000000',
        ]);
        $failRes->assertStatus(422)->assertJson(['success' => false]);
    }

    public function test_reset_password_succeeds_using_otp(): void
    {
        Mail::fake();
        $this->postJson('/auth/forgot-password', [
            'email' => 'student@ispsc.edu.ph',
        ]);

        $cached = cache()->get('reset_otp_student@ispsc.edu.ph');
        $otp = $cached['otp'];

        $resetRes = $this->postJson('/auth/reset-password', [
            'email' => 'student@ispsc.edu.ph',
            'otp' => $otp,
            'password' => 'NewSecureOtpPass2026',
            'password_confirmation' => 'NewSecureOtpPass2026',
        ]);

        $resetRes->assertStatus(200)->assertJson(['success' => true]);

        // Login check
        $loginRes = $this->postJson('/auth/login', [
            'username' => 'student',
            'password' => 'NewSecureOtpPass2026',
        ]);
        $loginRes->assertStatus(200)->assertJson(['success' => true]);
    }

    public function test_reset_password_fails_if_token_expired_after_15_minutes(): void
    {
        $this->postJson('/auth/forgot-password', [
            'email' => 'student@ispsc.edu.ph',
        ]);

        // Manually age the token created_at timestamp to 16 minutes ago
        DB::table('password_reset_tokens')
            ->where('email', 'student@ispsc.edu.ph')
            ->update(['created_at' => Carbon::now()->subMinutes(16)]);

        $resetRes = $this->postJson('/auth/reset-password', [
            'email' => 'student@ispsc.edu.ph',
            'token' => 'dummy-or-valid-token',
            'password' => 'NewSecurePass2026',
            'password_confirmation' => 'NewSecurePass2026',
        ]);

        $resetRes->assertStatus(422);
        $this->assertStringContainsString('expired', strtolower($resetRes->json('message') ?? ''));
    }
}
