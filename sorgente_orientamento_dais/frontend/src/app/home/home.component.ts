import { Component, OnInit } from '@angular/core';

import { CourseHttpService } from '../services/course-http.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Course } from '../models';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  providers: [
    { provide: CourseHttpService, useClass: CourseHttpService }
  ]
})
export class HomeComponent implements OnInit {
  private limit: number = 9;
  private skip: number = 0;
  new_courses: Course[] = [];
  scheduled_courses: Course[] = [];
  popular_courses: Course[] = [];

  error: string | null = null;
  message: string | null = null;

  constructor(
    private course_http: CourseHttpService,
    private router: Router,
    private activated_route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.getCourses().subscribe({
      next: (res) => {
        this.new_courses = res.courses;
      }
    });

    this.getCourses(true).subscribe({
      next: (res) => {
        this.scheduled_courses = res.courses
      }
    });

    this.getCourses(null, true).subscribe({
      next: (res) => {
        this.popular_courses = res.courses;
      }
    })

    this.activated_route.queryParams.subscribe((params: any) => {
      if (params.error && params.message) {
        this.error = params.error;
        this.message = params.message;
      }
    });
  }

  getCourses(scheduled: boolean | null = null, popular: boolean | null = null): Observable<{ courses: Course[], count: number }> {
    return this.course_http.getCourses(this.limit, this.skip, null, null, scheduled, popular)
  }

  counter(i: number) {
    let res = new Array(i);
    for (let ind = 0; ind < i; ind++) {
      res[ind] = ind;
    }

    return res;
  }
}
