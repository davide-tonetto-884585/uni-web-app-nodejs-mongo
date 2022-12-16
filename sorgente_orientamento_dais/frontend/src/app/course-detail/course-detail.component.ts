import { Component, ElementRef, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';

import { CourseHttpService } from '../services/course-http.service';
import { UserHttpService } from '../services/user-http.service';
import { Router, ActivatedRoute } from '@angular/router';
import {Course, courseSchedule, Lesson, Classroom, Question, Teacher} from '../models';
import { MessageDialogComponent } from '../message-dialog/message-dialog.component';
import { BACKEND_URL } from '../globals';
import { QuestionsHttpService } from '../services/questions-http.service';
import { PageEvent } from '@angular/material/paginator';
import { StatisticsHttpService } from '../services/statistics-http.service';
import {UserDataHttpService} from "../services/user-data-http.service";

@Component({
  selector: 'app-course-detail',
  templateUrl: './course-detail.component.html',
  styleUrls: ['./course-detail.component.css']
})
export class CourseDetailComponent implements OnInit {
  course_id: any;
  course: Course | undefined;
  docente: Teacher | undefined;
  prog_corso: courseSchedule[] = [];
  questions: Question[] = [];
  BACKEND_URL: string = BACKEND_URL;

  question_text: string = '';
  search_text: string | null = '';
  chiusa: string | null = null;
  order_by: string = 'like';

  limit: number = 10;
  skip: number = 0;
  count: number = 0;

  statistics: any;

  constructor(
    private course_http: CourseHttpService,
    private activatedRoute: ActivatedRoute,
    private user_http: UserHttpService,
    private question_http: QuestionsHttpService,
    public dialog: MatDialog,
    private statistics_http: StatisticsHttpService,
    private user_data_http: UserDataHttpService
  ) { }

  ngOnInit(): void {
    this.activatedRoute.paramMap.subscribe(params => {
      this.course_id = params.get('id');
    });

    this.course_http.getCourse(this.course_id).subscribe({
      next: (course: Course) => {
        this.course = course;
        this.user_data_http.getTeacherData(this.course?.teacherId).subscribe({
          next: (res) => {
            this.docente = res;
          }
        });
      }
    });

    this.loadProgs(true);

    this.question_http.getDomandeCorso(this.course_id, null, null, this.skip, this.limit, 'like').subscribe({
      next: (res) => {
        this.questions = res.questions;
        this.count = res.count;
      }
    })

    if (this.isAdmin() || this.isCourseTeacher()) {
      this.statistics_http.getCourseStatistics(this.course_id).subscribe({
        next: (res) => {
          this.statistics = res;
          let conf = Array();
          res.confronto_programmazioni_corso.forEach((prog: any, index: number) => {
            conf.push({
              name: `Schedule ${index + 1} (${prog.modalita})`,
              series: [
                {
                  name: 'Registrations',
                  value: prog.num_iscrizioni
                },
                {
                  name: 'Attendance',
                  value: prog.num_presenze
                }
              ]
            })
          })

          this.statistics.confronto_programmazioni_corso = conf;
        }
      })
    }
  }

  loadProgs(in_corso: boolean | null): void {
    this.course_http.getProgrammazioniCorso(this.course_id, in_corso).subscribe({
      next: (prog_corso: courseSchedule[]) => {
        this.prog_corso = prog_corso;
      }
    });
  }

  getId(): string | undefined {
    return this.user_http.getId();
  }

  isLogged(): boolean {
    return this.user_http.isLogged();
  }

  isStudent(): boolean {
    return this.user_http.isStudent();
  }

  isAdmin(): boolean {
    return this.user_http.isAdmin();
  }

  filter(): void {
    if (this.search_text == '') this.search_text = null;

    let chiusa = null;
    if (this.chiusa == '1') chiusa = true;
    else if (this.chiusa == '0') chiusa = false;

    this.question_http.getDomandeCorso(this.course_id, this.search_text, chiusa, this.skip, this.limit, this.order_by).subscribe({
      next: (res) => {
        this.questions = res.questions;
        this.count = res.count;
      }
    })
  }

  postQuestion(): void {
    const user_id = this.user_http.getId();
    if (this.question_text == '' || !user_id) return;

    this.question_http.addDomandaCorso(this.course_id, user_id, this.question_text).subscribe({
      next: (res) => {
        this.question_text = '';
        this.filter();
      },
      error: (err) => {
        this.dialog.open(MessageDialogComponent, {
          data: {
            text: err,
            title: 'Failed!',
            error: true
          },
        });
      }
    })
  }

  isCourseTeacher(): boolean {
    if (this.getId() == undefined) return false;
    else return this.docente?._id === this.getId();
  }

  onPageChange(pageEvent: PageEvent): void {
    this.limit = pageEvent.pageSize
    this.skip = pageEvent.pageIndex * this.limit;
    this.filter();
  }
}
