import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA as MAT_DIALOG_DATA, MatDialog} from '@angular/material/dialog';
import {CourseHttpService} from '../services/course-http.service';
import {AulaHttpService} from '../services/aula-http.service';

import {Classroom, Course, courseSchedule, Lesson} from '../models';
import {MessageDialogComponent} from '../message-dialog/message-dialog.component';
import {UserHttpService} from '../services/user-http.service';
import {MAT_DATE_FORMATS, MAT_NATIVE_DATE_FORMATS, MatDateFormats} from '@angular/material/core';

export const GRI_DATE_FORMATS: MatDateFormats = {
  ...MAT_NATIVE_DATE_FORMATS,
  display: {
    ...MAT_NATIVE_DATE_FORMATS.display,
    dateInput: {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    } as Intl.DateTimeFormatOptions,
  }
};

@Component({
  selector: 'app-course-modal',
  templateUrl: './course-modal.component.html',
  styleUrls: ['./course-modal.component.css'],
  providers: [
    {provide: MAT_DATE_FORMATS, useValue: GRI_DATE_FORMATS},
  ]
})
export class CourseModalComponent implements OnInit {
  progs: courseSchedule[] = [];
  aule: Classroom[] = [];
  course: Course;
  isNew: boolean;

  immagine_copertina: any;
  file_certificato: any;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { isNew: boolean, course: Course },
    private user_http: UserHttpService,
    private course_http: CourseHttpService,
    private aula_http: AulaHttpService,
    public dialog: MatDialog
  ) {
    this.course = data.course;
    this.isNew = data.isNew;
  }

  ngOnInit(): void {
    if (this.course && this.course._id !== '') {
      this.course_http.getProgrammazioniCorso(this.course._id, null, true).subscribe({
        next: (prog_corso: courseSchedule[]) => {
          this.progs = prog_corso;

          this.progs.forEach((el: courseSchedule) => {
            if (this.course) {
              this.course_http.getLezioniProgCorso(this.course._id, el._id).subscribe({
                next: (lezioni: Lesson[]) => {
                  el.lessons = lezioni;

                  el.lessons.forEach((les: Lesson) => {
                    if (les.classroomId) {
                      this.aula_http.getAula(les.classroomId).subscribe({
                        next: (aula: Classroom) => {
                          les.classroom = aula;
                        }
                      });
                    }
                  });
                }
              });
            }
          });
        }
      });
    }

    this.aula_http.getAule().subscribe({
      next: (aule: Classroom[]) => {
        this.aule = aule;
      }
    });
  }

  addProgCorso(): void {
    this.progs.push({
      _id: '',
      modality: '',
      inscriptionLimit: null,
      certificatePassword: '',
      lessons: [],
      inscriptions: undefined
    });
  }

  addProgLesson(index: number): void {
    this.progs[index].lessons?.push({
      _id: '',
      date: '',
      startTime: '',
      endTime: '',
      virtualRoomLink: null,
      virtualRoomPasscode: null,
      presencePasscode: '',
      classroomId: null,
      classroom: undefined,
    })
  }

  addCourse(): void {
    let user_id = this.user_http.getId() ?? -1;

    this.course_http.addCourse(this.course).subscribe({
      next: (d) => {
        console.log(d)
        this.progs.forEach((prog) => {
          this.course_http.addProgCorso(d.courseId, prog).subscribe({
            next: (d2) => {
              if (prog.lessons)
                this.addLezioni(d.courseId, d2.courseScheduleId, prog.lessons);
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
        });
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

  updateCourse(): void {
    this.course_http.updateCourse(this.course).subscribe({
      next: (d) => {
        if (this.progs.length === 0) this.dialog.closeAll();

        this.progs.forEach((prog) => {
          if (prog._id != '') {
            this.course_http.updateProgCorso(this.course._id, prog).subscribe({
              next: (d) => {
                if (prog.lessons)
                  this.addLezioni(this.course._id, prog._id, prog.lessons);
                else
                  this.dialog.closeAll()
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
          } else {
            this.course_http.addProgCorso(this.course._id, prog).subscribe({
              next: (d) => {
                if (prog.lessons)
                  this.addLezioni(this.course._id, d.courseScheduleId, prog.lessons);
                else
                  this.dialog.closeAll()
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
        })
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

  addLezioni(id_corso: string, id_prog: string, lezioni: Lesson[]): void {
    lezioni.forEach((l) => {
      if (l._id == '') {
        this.course_http.addLezioneProg(id_corso, id_prog, l).subscribe({
          next: (d) => {
            this.dialog.closeAll()
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
      } else {
        this.course_http.updateLezioneProg(id_corso, id_prog, l).subscribe({
          next: (d) => {
            this.dialog.closeAll()
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
    })
  }

  upload_immagine_copertina(event: any) {
    const file: File = event.target.files[0];

    if (file) {
      this.course.image = file;
    }
  }

  upload_file_certificato(event: any) {
    const file: File = event.target.files[0];

    if (file) {
      this.course.certificateFile = file;
    }
  }

  formatDate(date: Date): string {
    return [
      date.getFullYear(),
      this.padTo2Digits(date.getMonth() + 1),
      this.padTo2Digits(date.getDate()),
    ].join('-');
  }

  convertDate(date: string): Date {
    const [month, day, year] = date.split('/');
    return new Date(+year, +month - 1, +day);
  }

  adjustDate(lezione: Lesson, event: any): void {
    if (event.value)
      lezione.date = this.formatDate(event.value);
  }

  private padTo2Digits(num: number): string {
    return num.toString().padStart(2, '0');
  }
}
