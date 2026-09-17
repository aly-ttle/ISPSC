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
     * Seed the application's database with demo accounts for all roles and multiple campus departments.
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

        // 3. Department 1: MIS / ICT Center Supervisor & Trainee
        $supMIS = User::create([
            'name' => 'Engr. Roberto Gomez',
            'username' => 'supervisor',
            'email' => 'roberto.gomez@ispsc.edu.ph',
            'password' => Hash::make('ispsc1234'),
            'role' => 'supervisor',
            'department' => 'Management Information Systems (MIS) / ICT Center',
            'id_number' => 'ISPSC-SUP-102',
        ]);

        $studentMIS = User::create([
            'name' => 'Mark Anthony Ramos',
            'username' => 'student',
            'email' => 'student@ispsc.edu.ph',
            'password' => Hash::make('ispsc1234'),
            'role' => 'student',
            'department' => 'BS Information Technology',
            'id_number' => '2026-0412-TG',
        ]);

        Placement::create([
            'student_id' => $studentMIS->id,
            'supervisor_id' => $supMIS->id,
            'company_name' => 'Management Information Systems (MIS) / ICT Center',
            'department' => 'Network Administration & Systems Development Unit',
            'supervisor_name' => $supMIS->name,
            'supervisor_email' => $supMIS->email,
            'period' => 'AY 2025–2026',
            'office_hours' => '8:00 AM – 5:00 PM (Mon–Fri)',
            'status' => 'Active',
            'notes' => 'In-campus practicum deployment at ISPSC MIS/ICT Center.',
        ]);

        for ($i = 5; $i >= 1; $i--) {
            Attendance::create([
                'student_id' => $studentMIS->id,
                'date' => Carbon::today()->subDays($i)->toDateString(),
                'schedule' => 'Regular (8h)',
                'time_in' => '8:00 AM',
                'time_out' => '5:00 PM',
                'total_hours' => 8.00,
                'status' => 'Present',
                'remarks' => 'Completed scheduled campus MIS tasks on-site.',
            ]);
        }

        Task::create([
            'student_id' => $studentMIS->id,
            'assigned_by' => $supMIS->id,
            'title' => 'Campus Network Maintenance & Lab Audit',
            'details' => 'Assist in checking computer lab connectivity and updating system drivers in Academic Labs.',
            'due_date' => Carbon::today()->addDays(2)->toDateString(),
            'meta' => "Department Supervisor Assigned ({$supMIS->name})",
            'is_completed' => true,
        ]);

        Task::create([
            'student_id' => $studentMIS->id,
            'assigned_by' => $supMIS->id,
            'title' => 'Portal UI & Database Verification',
            'details' => 'Audit user role workflows and ensure in-campus department assignments are correctly mapped.',
            'due_date' => Carbon::today()->addDays(5)->toDateString(),
            'meta' => "Department Supervisor Assigned ({$supMIS->name})",
            'is_completed' => false,
        ]);

        Journal::create([
            'student_id' => $studentMIS->id,
            'title' => 'Campus IT Infrastructure Maintenance & Web Portal Support',
            'reflection' => 'Assisted the MIS department supervisor in configuring network switches and testing internal web modules for student registration.',
            'entry_date' => Carbon::today()->toDateString(),
            'hours' => '8 hours rendered',
            'status' => 'Approved',
            'supervisor_remarks' => 'Great technical initiative and good coordination with department staff.',
        ]);

        Requirement::create([
            'student_id' => $studentMIS->id,
            'name' => 'Campus Placement & Endorsement Form',
            'status' => 'Approved',
            'meta' => 'Endorsement form signed by Host Campus Department Head and OJT Adviser',
            'remarks' => 'Verified and signed by Campus MIS Supervisor & OJT Adviser.',
        ]);

        Requirement::create([
            'student_id' => $studentMIS->id,
            'name' => 'Parent Consent Form',
            'status' => 'Pending review',
            'meta' => 'Signed parent/guardian practicum consent for campus deployment',
            'remarks' => null,
        ]);

        Requirement::create([
            'student_id' => $studentMIS->id,
            'name' => 'Medical Clearance Renewal',
            'status' => 'Approved',
            'meta' => 'Health clearance issued by Campus Clinic',
            'remarks' => 'Verified by Campus Nurse.',
        ]);

        AccomplishmentReport::create([
            'student_id' => $studentMIS->id,
            'title' => 'Week 1: Campus IT Infrastructure Support',
            'summary' => 'Configured laboratory workstations, deployed network drops in CCS Lab 2, and assisted users.',
            'period' => 'Weekly Synthesis',
            'status' => 'Approved',
            'adviser_remarks' => 'Well documented and aligned with course outcomes.',
        ]);

        Evaluation::create([
            'student_id' => $studentMIS->id,
            'evaluator_id' => $supMIS->id,
            'rating' => 96.00,
            'comments' => 'Outstanding diligence, punctuality, and great assistance to department staff in daily campus operations.',
            'period' => 'Workplace Appraisal',
            'status' => 'Completed',
        ]);

        Feedback::create([
            'student_id' => $studentMIS->id,
            'supervisor_id' => $supMIS->id,
            'rating' => 95.00,
            'notes' => 'Very reliable in handling technical support requests across campus offices. Keep up the great work.',
        ]);

        // 4. Department 2: Office of the Campus Registrar Supervisor & Trainee
        $supReg = User::create([
            'name' => 'Mrs. Alicia Mendoza',
            'username' => 'registrar',
            'email' => 'alicia.mendoza@ispsc.edu.ph',
            'password' => Hash::make('ispsc1234'),
            'role' => 'supervisor',
            'department' => "Office of the Campus Registrar",
            'id_number' => 'ISPSC-REG-105',
        ]);

        $studentReg = User::create([
            'name' => 'Bea Patricia Gomez',
            'username' => 'student2',
            'email' => 'bea.gomez@ispsc.edu.ph',
            'password' => Hash::make('ispsc1234'),
            'role' => 'student',
            'department' => 'BS Information Technology',
            'id_number' => '2026-0520-TG',
        ]);

        Placement::create([
            'student_id' => $studentReg->id,
            'supervisor_id' => $supReg->id,
            'company_name' => "Office of the Campus Registrar",
            'department' => 'Student Records & Enrollment Services Section',
            'supervisor_name' => $supReg->name,
            'supervisor_email' => $supReg->email,
            'period' => 'AY 2025–2026',
            'office_hours' => '8:00 AM – 5:00 PM (Mon–Fri)',
            'status' => 'Active',
            'notes' => 'Assigned to records digitalization and transcript verification support.',
        ]);

        for ($i = 4; $i >= 1; $i--) {
            Attendance::create([
                'student_id' => $studentReg->id,
                'date' => Carbon::today()->subDays($i)->toDateString(),
                'schedule' => 'Regular (8h)',
                'time_in' => '8:00 AM',
                'time_out' => '5:00 PM',
                'total_hours' => 8.00,
                'status' => 'Present',
                'remarks' => 'Assisted in archival scanning and student document filing.',
            ]);
        }

        Task::create([
            'student_id' => $studentReg->id,
            'assigned_by' => $supReg->id,
            'title' => 'Digitize Student Permanent Records (Form 137/Transcript Archive)',
            'details' => 'Scan, index, and organize student permanent records into the digital archive database.',
            'due_date' => Carbon::today()->addDays(3)->toDateString(),
            'meta' => "Department Supervisor Assigned ({$supReg->name})",
            'is_completed' => false,
        ]);

        Journal::create([
            'student_id' => $studentReg->id,
            'title' => 'Student Record Archiving and Verification',
            'reflection' => 'Assisted registrar staff in validating student subject loads and encoding scholastic entries.',
            'entry_date' => Carbon::today()->toDateString(),
            'hours' => '8 hours rendered',
            'status' => 'Approved',
            'supervisor_remarks' => 'Prompt and accurate attention to detail in handling student records.',
        ]);

        Requirement::create([
            'student_id' => $studentReg->id,
            'name' => 'Campus Placement & Endorsement Form',
            'status' => 'Approved',
            'meta' => 'Endorsement form signed by Registrar Supervisor and OJT Adviser',
            'remarks' => 'Verified and accepted.',
        ]);

        Requirement::create([
            'student_id' => $studentReg->id,
            'name' => 'Parent Consent Form',
            'status' => 'Approved',
            'meta' => 'Parent consent verified',
            'remarks' => 'Complete documentation.',
        ]);

        AccomplishmentReport::create([
            'student_id' => $studentReg->id,
            'title' => 'Week 1: Registrar Records Management',
            'summary' => 'Digitized over 150 student record files and updated student catalog records.',
            'period' => 'Weekly Synthesis',
            'status' => 'Approved',
            'adviser_remarks' => 'Great start on registrar assignment.',
        ]);

        Evaluation::create([
            'student_id' => $studentReg->id,
            'evaluator_id' => $supReg->id,
            'rating' => 94.00,
            'comments' => 'Meticulous, dependable, and highly cooperative with office personnel.',
            'period' => 'Workplace Appraisal',
            'status' => 'Completed',
        ]);

        Feedback::create([
            'student_id' => $studentReg->id,
            'supervisor_id' => $supReg->id,
            'rating' => 93.00,
            'notes' => 'Great work organizing document folders and student clearance files.',
        ]);

        // 5. Department 3: Campus Library & Learning Resource Center Supervisor & Trainee
        $supLib = User::create([
            'name' => 'Mr. Eduardo Cruz',
            'username' => 'library',
            'email' => 'eduardo.cruz@ispsc.edu.ph',
            'password' => Hash::make('ispsc1234'),
            'role' => 'supervisor',
            'department' => 'Campus Library & Learning Resource Center',
            'id_number' => 'ISPSC-LIB-108',
        ]);

        $studentLib = User::create([
            'name' => 'Christian David Santos',
            'username' => 'student3',
            'email' => 'christian.santos@ispsc.edu.ph',
            'password' => Hash::make('ispsc1234'),
            'role' => 'student',
            'department' => 'BS Computer Science',
            'id_number' => '2026-0631-TG',
        ]);

        Placement::create([
            'student_id' => $studentLib->id,
            'supervisor_id' => $supLib->id,
            'company_name' => 'Campus Library & Learning Resource Center',
            'department' => 'Library Automation & Electronic Cataloging Unit',
            'supervisor_name' => $supLib->name,
            'supervisor_email' => $supLib->email,
            'period' => 'AY 2025–2026',
            'office_hours' => '8:00 AM – 5:00 PM (Mon–Fri)',
            'status' => 'Active',
            'notes' => 'Assigned to Koha library system administration and catalog indexing.',
        ]);

        for ($i = 3; $i >= 1; $i--) {
            Attendance::create([
                'student_id' => $studentLib->id,
                'date' => Carbon::today()->subDays($i)->toDateString(),
                'schedule' => 'Regular (8h)',
                'time_in' => '8:00 AM',
                'time_out' => '5:00 PM',
                'total_hours' => 8.00,
                'status' => 'Present',
                'remarks' => 'Assisted students with OPAC catalog search and e-journal resources.',
            ]);
        }

        Task::create([
            'student_id' => $studentLib->id,
            'assigned_by' => $supLib->id,
            'title' => 'OPAC Terminal Maintenance and Barcode Re-indexing',
            'details' => 'Inspect library OPAC stations and re-index barcode records in the automation system.',
            'due_date' => Carbon::today()->addDays(4)->toDateString(),
            'meta' => "Department Supervisor Assigned ({$supLib->name})",
            'is_completed' => false,
        ]);

        Journal::create([
            'student_id' => $studentLib->id,
            'title' => 'Library Management System Maintenance',
            'reflection' => 'Assisted in updating the Koha digital library repository and troubleshooting network connectivity for student workstations.',
            'entry_date' => Carbon::today()->toDateString(),
            'hours' => '8 hours rendered',
            'status' => 'Approved',
            'supervisor_remarks' => 'Good initiative on technical tasks in the learning center.',
        ]);

        Requirement::create([
            'student_id' => $studentLib->id,
            'name' => 'Campus Placement & Endorsement Form',
            'status' => 'Approved',
            'meta' => 'Endorsement signed by Head Librarian & OJT Adviser',
            'remarks' => 'Approved for library unit deployment.',
        ]);

        Evaluation::create([
            'student_id' => $studentLib->id,
            'evaluator_id' => $supLib->id,
            'rating' => 92.00,
            'comments' => 'Displays good technical skills in library automated indexing.',
            'period' => 'Workplace Appraisal',
            'status' => 'Completed',
        ]);
    }
}
