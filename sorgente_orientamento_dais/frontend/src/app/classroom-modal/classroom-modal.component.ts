import {Component, OnInit} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {AulaHttpService} from '../services/aula-http.service';
import {Classroom} from '../models';

@Component({
  selector: 'app-classroom-modal',
  templateUrl: './classroom-modal.component.html',
  styleUrls: ['./classroom-modal.component.css']
})
export class ClassroomModalComponent implements OnInit {
  aule: Classroom[] = []
  new_aule: Classroom[] = []
  canSave = false;

  constructor(
    private aula_http: AulaHttpService,
    private dialog: MatDialog
  ) {
  }

  ngOnInit(): void {
    this.aula_http.getAule().subscribe({
      next: aule => {
        this.aule = aule;
      }
    })
  }

  addAula(): void {
    this.new_aule.push({} as Classroom);
    this.canSave = true;
  }

  save() {
    this.new_aule.forEach(aula => {
      this.aula_http.addAula(aula).subscribe({
        next: res => {
          this.dialog.closeAll();
        }
      })
    })
  }
}
