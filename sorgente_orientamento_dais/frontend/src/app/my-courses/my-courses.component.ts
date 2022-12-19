import {Component, OnInit} from '@angular/core';

import {Classroom, Course, courseSchedule, Lesson} from '../models';
import {CourseHttpService} from '../services/course-http.service';
import {AulaHttpService} from '../services/aula-http.service';
import {UserHttpService} from '../services/user-http.service';
import {Router} from '@angular/router';
import {MatDialog} from '@angular/material/dialog';
import {CourseModalComponent} from '../course-modal/course-modal.component';
import {MessageDialogComponent} from '../message-dialog/message-dialog.component';

@Component({
  selector: 'app-my-courses',
  templateUrl: './my-courses.component.html',
  styleUrls: ['./my-courses.component.css']
})
export class MyCoursesComponent implements OnInit {
  courses: any[] = [];

  constructor(
    private user_http: UserHttpService,
    private course_http: CourseHttpService,
    private aula_http: AulaHttpService,
    private router: Router,
    public dialog: MatDialog
  ) {
  }

  ngOnInit(): void {
    this.refresh();
  }

  isStudent(): boolean {
    return this.user_http.isStudent();
  }

  isTeacher(): boolean {
    return this.user_http.isTeacher();
  }

  getId(): string {
    let id = this.user_http.getId();
    if (id) return id;
    else return '';
  }

  unsubscribeStudent(id_corso: string, id_prog: string, id_studente: string) {
    this.course_http.unsubscribeStudent(id_corso, id_prog, id_studente).subscribe({
      next: () => {
        this.refresh();
      }
    })
  }

  refresh(): void {
    if (!this.user_http.isLogged()) {
      this.router.navigate(['/login']);
    } else {
      let id = this.user_http.getId();

      if (this.user_http.isStudent() && id) {
        this.course_http.getInscriptionsStudent(id).subscribe({
          next: (corsi: any[]) => {
            this.courses = corsi;

            this.courses.forEach((corso) => {
              this.course_http.getCourse(corso.courseId).subscribe({
                next: (course: Course) => {
                  Object.assign(corso, course);
                }
              })

              this.course_http.getProgrammazioneCorso(corso.courseId, corso.courseScheduleId).subscribe({
                next: (programmazione: courseSchedule) => {
                  Object.assign(corso, programmazione);

                  corso.lessons.forEach((les: Lesson) => {
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
            });
          }
        })
      } else if (this.user_http.isTeacher() && id) {
        this.course_http.getCorsiDocente(id).subscribe({
          next: (corsi: Course[]) => {
            this.courses = corsi;
          }
        })
      }
    }
  }

  openCourseModal(course
                    :
                    Course
  ) {
    const dialog = this.dialog.open(CourseModalComponent, {
      data: {
        isNew: course._id === '',
        course: course
      }
    });

    dialog.afterClosed().subscribe(() => this.refresh());
  }

  getCertificate(id_corso
                   :
                   string, id_prog_corso
                   :
                   string, certificatePassword
                   :
                   string
  ):
    void {
    console.log(this.courses);

    this.course_http.getCertificate(id_corso, id_prog_corso, certificatePassword).subscribe({
      next: (response) => {
        let fileName = 'certificate';
        let blob: Blob = response.body as Blob;
        let a = document.createElement('a');
        a.download = fileName;
        a.href = window.URL.createObjectURL(blob);
        a.click();
      },
      error: (response) => {
        this.dialog.open(MessageDialogComponent, {
          data: {
            text: response.error.errormessage,
            title: 'Failed!',
            error: true
          },
        });
      }
    })
  }
}
