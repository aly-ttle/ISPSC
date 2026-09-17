<?php

namespace Database\Seeders;

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
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database with demo accounts for all 4 roles.
     * In-Campus Deployment: All trainees are deployed in existing campus departments/units.
     */
    public function run(): void
    {
        // 1. Admin Account
        $admin = User::create([
            'name' => 'ISPSC System Administrator',
            'username' => 'admin',
            'email' => 'admin@ispsc.edu.ph',
            'password' => Hash::make('ispsc1234'),
            'role' => 'admin',
            'department' => 'Management Information Systems (MIS)',
            'id_number' => 'ISPSC-ADM-01',
        ]);

        // 2. Faculty OJT Adviser Account
        $adviser = User::create([
            'name' => 'Prof. Maria Elena Santos',
            'username' => 'adviser',
            'email' => 'adviser@ispsc.edu.ph',
            'password' => Hash::make('ispsc1234'),
            'role' => 'adviser',
            'department' => 'College of Computing Studies & Information Technology',
            'id_number' => 'FAC-2026-088',
        ]);

        // 3. Department Supervisor (Campus Office / Unit Head) Account
        $supervisor = User::create([
            'name' => 'Engr. Roberto Gomez',
            'username' => 'supervisor',
            'email' => 'roberto.gomez@ispsc.edu.ph',
            'password' => Hash::make('ispsc1234'),
            'role' => 'supervisor',
            'department' => 'Management Information Systems (MIS) / ICT Center',
            'id_number' => 'ISPSC-SUP-102',
        ]);

        // 4. OJT Student Trainee Account
        $student = User::create([
            'name' => 'Mark Anthony Ramos',
            'username' => 'student',
            'email' => 'student@ispsc.edu.ph',
            'password' => Hash::make('ispsc1234'),
            'role' => 'student',
            'department' => 'BS Information Technology',
            'id_number' => '2026-0412-TG',
        ]);

        // Create Demo In-Campus Placement for Student
        Placement::create([
            'student_id' => $student->id,
            'company_name' => 'Management Information Systems (MIS) / ICT Center',
            'department' => 'Network Administration & Systems Development Unit',
            'supervisor_name' => $supervisor->name,
            'supervisor_email' => $supervisor->email,
            'period' => 'AY 2025–2026',
            'office_hours' => '8:00 AM – 5:00 PM (Mon–Fri)',
            'status' => 'Active',
            'notes' => 'In-campus practicum deployment at ISPSC MIS/ICT Center.',
        ]);

        // Seed Sample Attendance Logs (Total: 40 hrs)
        for ($i = 5; $i >= 1; $i--) {
            Attendance::create([
                'student_id' => $student->id,
                'date' => Carbon::today()->subDays($i)->toDateString(),
                'schedule' => 'Regular (8h)',
                'time_in' => '8:00 AM',
                'time_out' => '5:00 PM',
                'total_hours' => 8.00,
                'status' => 'Present',
                'remarks' => 'Completed scheduled campus department tasks on-site.',
            ]);
        }

        // Seed Sample Tasks
        Task::create([
            'student_id' => $student->id,
            'assigned_by' => $supervisor->id,
            'title' => 'Campus Network Maintenance & Lab Audit',
            'details' => 'Assist in checking computer lab connectivity and updating system drivers in Academic Labs.',
            'due_date' => Carbon::today()->addDays(2)->toDateString(),
            'meta' => "Department Supervisor Assigned ({$supervisor->name})",
            'is_completed' => true,
        ]);

        Task::create([
            'student_id' => $student->id,
            'assigned_by' => $supervisor->id,
            'title' => 'Portal UI & Database Verification',
            'details' => 'Audit user role workflows and ensure in-campus department assignments are correctly mapped.',
            'due_date' => Carbon::today()->addDays(5)->toDateString(),
            'meta' => "Department Supervisor Assigned ({$supervisor->name})",
            'is_completed' => false,
        ]);

        // Seed Sample Journal
        Journal::create([
            'student_id' => $student->id,
            'title' => 'Campus IT Infrastructure Maintenance & Web Portal Support',
            'reflection' => 'Assisted the MIS department supervisor in configuring network switches and testing internal web modules for student registration.',
            'entry_date' => Carbon::today()->toDateString(),
            'hours' => '8 hours rendered',
            'status' => 'Approved',
            'supervisor_remarks' => 'Great technical initiative and good coordination with department staff.',
        ]);

        // Seed Sample Requirements
        Requirement::create([
            'student_id' => $student->id,
            'name' => 'Internal Department Endorsement & Acceptance',
            'status' => 'Approved',
            'meta' => 'Endorsement form signed by Host Campus Department Head and OJT Adviser',
            'remarks' => 'Verified and signed by Campus MIS Supervisor & OJT Adviser.',
        ]);

        Requirement::create([
            'student_id' => $student->id,
            'name' => 'Parent / Guardian Consent Form',
            'status' => 'Pending review',
            'meta' => 'Signed parent/guardian practicum consent for campus deployment',
            'remarks' => null,
        ]);

        Requirement::create([
            'student_id' => $student->id,
            'name' => 'Medical Certificate / Health Clearance',
            'status' => 'Approved',
            'meta' => 'Health clearance issued by Campus Clinic',
            'remarks' => 'Verified by Campus Nurse.',
        ]);

        // Seed Sample Evaluation
        Evaluation::create([
            'student_id' => $student->id,
            'evaluator_id' => $supervisor->id,
            'rating' => 96.00,
            'comments' => 'Outstanding diligence, punctuality, and great assistance to department staff in daily campus operations.',
            'period' => 'Department Midterm Appraisal',
            'status' => 'Completed',
        ]);

        // Seed Sample Feedback
        Feedback::create([
            'student_id' => $student->id,
            'supervisor_id' => $supervisor->id,
            'rating' => 95.00,
            'notes' => 'Very reliable in handling technical support requests across campus offices. Keep up the great work.',
        ]);
    }
}
