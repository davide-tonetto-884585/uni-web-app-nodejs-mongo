import {Component, Input, OnInit} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {MessageDialogComponent} from '../message-dialog/message-dialog.component';

import {Answer, Question, Teacher} from '../models';
import {QuestionsHttpService} from '../services/questions-http.service';
import {UserHttpService} from '../services/user-http.service';

@Component({
  selector: 'app-question-item',
  templateUrl: './question-item.component.html',
  styleUrls: ['./question-item.component.css']
})
export class QuestionItemComponent implements OnInit {
  @Input() id_corso!: string;
  @Input() question: Question | undefined;
  @Input() docente_corso: Teacher | undefined;
  replies: Answer[] = [];
  answer_text: string = '';
  utenti_like: any[] = [];

  constructor(
    private user_http: UserHttpService,
    private question_http: QuestionsHttpService,
    private dialog: MatDialog
  ) {
  }

  ngOnInit(): void {
    this.reloadLike();
  }

  reloadLike(): void {
    if (this.question)
      this.question_http.getLikeDomanda(this.id_corso, this.question._id).subscribe({
        next: (res) => {
          this.utenti_like = res;
        }
      })
  }

  isLogged(): boolean {
    return this.user_http.isLogged();
  }

  alreadyLiked(): boolean {
    let res = false;

    this.utenti_like.every((like) => {
      if (like.userId == this.user_http.getId()) {
        res = true;
        return false;
      }

      return true;
    })

    return res;
  }

  addLikeDomanda(): void {
    if (this.question)
      this.question_http.addLikeDomanda(this.id_corso, this.question?._id).subscribe({
        next: (res) => {
          if (this.question && this.question.likes?.length != null) {
            this.question.likes.push({userId: this.user_http.getId()});
          }
          this.reloadLike();
        }
      })
  }

  canAnswer(): boolean {
    if (this.user_http.getId() && !this.question?.isClosed) {
      if (this.user_http.getId() === this.question?.userId._id)
        return true;

      if (this.docente_corso?._id === this.user_http.getId()) {
        return true;
      }
    }

    return false;
  }

  loadReplies(): void {
    if (this.question)
      this.question_http.getRisposteDomanda(this.id_corso, this.question._id).subscribe({
        next: (res) => {
          this.replies = res;
        }
      })
  }

  postAnsware(): void {
    const user_id = this.user_http.getId();
    if (this.answer_text == '' || !user_id || !this.question) return;

    this.question_http.addRispostaCorso(this.id_corso, user_id, this.question._id, this.answer_text).subscribe({
      next: (res) => {
        this.answer_text = '';
        this.loadReplies();
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

  chiudiDomanda(): void {
    if (this.question)
      this.question_http.closeDomanda(this.id_corso, this.question._id).subscribe({
        next: (res) => {
          if (this.question)
            this.question.isClosed = true;
        }
      })
  }
}
