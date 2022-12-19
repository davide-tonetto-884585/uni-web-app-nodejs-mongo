import {Component, Input, OnInit} from '@angular/core';

@Component({
  selector: 'app-carousel',
  templateUrl: './carousel.component.html',
  styleUrls: ['./carousel.component.css']
})
export class CarouselComponent implements OnInit {
  static id: number = 0;
  @Input() title: string = "";
  @Input() exploreLink: string | undefined;
  personal_id: number = CarouselComponent.id;

  constructor() {
    CarouselComponent.id += 1;
  }

  ngOnInit(): void {
  }

  getId(): number {
    return this.personal_id;
  }

}
