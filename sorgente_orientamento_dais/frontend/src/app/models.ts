export interface User {
  mail: string;
  password: string | null;
  name: string;
  surname: string;
  birthdate: string;
  gender: string | null;
}

export interface Student {
  _id: string;
  name: string;
  surname: string;
  fieldOfStudy: string | null;
  schoolId: string | null;
}

export interface Teacher {
  _id: string;
  name: string;
  surname: string;
  description: string | null;
  teacherPageLink: string | null;
  profilePicture: any | null;
}

export interface UserData {
  id: string;
  mail: string;
  password: string;
  name: string;
  surname: string;
  birthdate: string;
  exp: string;
  schoolId: string | null;
  fieldOfStudy: string | null;
  description: string | null;
  profilePicture: string | null;
  teacherPageLink: string | null;
  roles: string[];
}

export interface Course {
  _id: string;
  title: string;
  description: string | null;
  language: string | null;
  image: any | null;
  certificateFile: any | null;
  enabled: boolean;
  teacherId: string;
}

export interface courseSchedule {
  _id: string;
  modality: string;
  inscriptionLimit: number | null;
  certificatePassword: string;
  lessons: Lesson[] | undefined;
  inscriptions: any[] | undefined;
}

export interface Lesson {
  _id: string;
  date: string;
  startTime: string;
  endTime: string;
  virtualRoomLink: string | null;
  virtualRoomPasscode: string | null;
  presencePasscode: string;
  classroomId: string | null;
  classroom: Classroom | undefined;
}

export interface Classroom {
  _id: string;
  name: string;
  building: string;
  campus: string;
  capacity: string;
}

export interface Question {
  _id: string;
  text: string;
  isClosed: boolean;
  timestamp: string;
  userId: {
    _id: string;
    name: string;
    surname: string;
  };
  likes: any[] | undefined;
}

export interface Answer {
  _id: string;
  text: string;
  timestamp: string;
  userId: {
    _id: string;
    name: string;
    surname: string;
  };
}

export interface Statistics {
  maleInscriptionsCount: number,
  femaleInscriptionCount: number,
  otherInscriptionCount: number,
  middleAge: number,
  inscriptionCount: number,
  lessonsCount: number,
  attendanceCount: number,
  studentDistribution: { name: string, value: number }[],
  studentProvenience: { name: string, value: number }[],
  inPresenceInscriptionCount: number,
  onlineInscriptionCount: number,
  dualInscriptionCount: number,
  inPresenceLessonsCount: number,
  onlineLessonsCount: number,
  dualLessonsCount: number,
  inPresenceAttendanceCount: number,
  onlineAttendanceCount: number,
  dualAttendanceCount: number,
  schedulesComparison: any[]

}
