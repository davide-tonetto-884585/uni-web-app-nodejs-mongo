import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BACKEND_URL } from '../globals';
import {Teacher} from "../models";

@Component({
  selector: 'app-teacher-card',
  templateUrl: './teacher-card.component.html',
  styleUrls: ['./teacher-card.component.css']
})
export class TeacherCardComponent implements OnInit {
  @Input() teacher?: Teacher;
  BACKEND_URL: string = BACKEND_URL;

  constructor(private router: Router) { }

  ngOnInit(): void {
  }

  openTeacherPage() {
    if (this.teacher?._id)
      this.router.navigate([`/teacher/${this.teacher._id}`])
  }
}
