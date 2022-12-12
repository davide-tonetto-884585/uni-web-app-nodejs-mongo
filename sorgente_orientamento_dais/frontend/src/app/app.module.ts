import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { NgCeilPipeModule } from 'angular-pipes';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { UserLoginComponent } from './user-login/user-login.component';
import { StudentSignupComponent } from './student-signup/student-signup.component';

import { UserHttpService } from './user-http.service';
import { ActivateProfileComponent } from './activate-profile/activate-profile.component';
import { HomeComponent } from './home/home.component';
import { TopBarComponent } from './top-bar/top-bar.component';
import { CourseCardComponent } from './course-card/course-card.component';
import { CarouselComponent } from './carousel/carousel.component';
import { CarouselItemComponent } from './carousel-item/carousel-item.component';
import { CoursesComponent } from './courses/courses.component';
import { CourseDetailComponent } from './course-detail/course-detail.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatLegacyTabsModule as MatTabsModule } from '@angular/material/legacy-tabs';
import { MessageDialogComponent } from './message-dialog/message-dialog.component';
import { MatLegacyDialogModule as MatDialogModule } from '@angular/material/legacy-dialog';
import { MyCoursesComponent } from './my-courses/my-courses.component';
import { CourseModalComponent } from './course-modal/course-modal.component';
import { MatLegacyInputModule as MatInputModule } from '@angular/material/legacy-input';
import { MatLegacySelectModule as MatSelectModule } from '@angular/material/legacy-select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatExpansionModule } from '@angular/material/expansion';
import { QuestionItemComponent } from './question-item/question-item.component';
import { MatLegacyRadioModule as MatRadioModule } from '@angular/material/legacy-radio';
import { MatLegacyPaginatorModule as MatPaginatorModule } from '@angular/material/legacy-paginator';
import { CourseScheduleItemComponent } from './course-schedule-item/course-schedule-item.component';
import { MatLegacyTooltipModule as MatTooltipModule } from '@angular/material/legacy-tooltip';
import { QRCodeModule } from 'angular2-qrcode';
import { MatLegacyAutocompleteModule as MatAutocompleteModule } from '@angular/material/legacy-autocomplete';
import { TeacherSignupComponent } from './teacher-signup/teacher-signup.component';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { SettingsModalComponent } from './settings-modal/settings-modal.component';
import { TeacherCardComponent } from './teacher-card/teacher-card.component';
import { MatLegacyCardModule as MatCardModule } from '@angular/material/legacy-card';
import { TeacherPageComponent } from './teacher-page/teacher-page.component';
import { ProfileModalComponent } from './profile-modal/profile-modal.component';
import { ClassroomModalComponent } from './classroom-modal/classroom-modal.component';

@NgModule({
  declarations: [
    AppComponent,
    UserLoginComponent,
    StudentSignupComponent,
    ActivateProfileComponent,
    HomeComponent,
    TopBarComponent,
    CourseCardComponent,
    CarouselComponent,
    CarouselItemComponent,
    CoursesComponent,
    CourseDetailComponent,
    MessageDialogComponent,
    MyCoursesComponent,
    CourseModalComponent,
    QuestionItemComponent,
    CourseScheduleItemComponent,
    TeacherSignupComponent,
    SettingsModalComponent,
    TeacherCardComponent,
    TeacherPageComponent,
    ProfileModalComponent,
    ClassroomModalComponent,
  ],
  imports: [
    FormsModule,
    HttpClientModule,
    BrowserModule,
    AppRoutingModule,
    NgCeilPipeModule,
    BrowserAnimationsModule,
    MatTabsModule,
    MatDialogModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatExpansionModule,
    MatRadioModule,
    MatPaginatorModule,
    MatTooltipModule,
    QRCodeModule,
    MatAutocompleteModule,
    NgxChartsModule,
    MatCardModule
  ],
  providers: [
    { provide: UserHttpService, useClass: UserHttpService }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
