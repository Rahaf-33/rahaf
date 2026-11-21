import type { Account } from '@/types';

/**
 * Initial accounts. Passwords are never stored in readable form: only a random salt and a
 * PBKDF2-SHA256 hash (120,000 iterations). The initial passwords were handed to the school
 * owner separately, and every account must change its password on first sign-in.
 */
export const INITIAL_ACCOUNTS: Account[] = [
  { id: 'U-RAHAF', username: 'rahaf', name: 'أ. رهف العمري', nameEn: 'Ms. Rahaf Al-Omari', role: 'principal', title: 'قائدة المدرسة', titleEn: 'School Principal', salt: 'daf91f5320936a334d3a3f5f03052f93', hash: 'eaba11701acb4085b2db393aacfc7a920ae44cd8db6d47df271d82a28abe3500', active: true, mustChangePassword: true },
  { id: 'U-WAAD', username: 'waad', name: 'أ. وعد محمد', nameEn: 'Ms. Waad Mohammed', role: 'teacher', title: 'معلمة – رائدة فصل 2/3', titleEn: 'Teacher – Homeroom 2/3', teacherId: 'T7', salt: '4356a1f1109ec77e8dbef26871489dff', hash: '4ea9df3be06a6c4f817965954d2c601daacfa34166c829d1ae57bd9c73e8a45a', active: true, mustChangePassword: true },
  { id: 'U-DANA', username: 'dana', name: 'أ. دانة فارس', nameEn: 'Ms. Dana Fares', role: 'teacher', title: 'معلمة – رائدة فصل 1/1', titleEn: 'Teacher – Homeroom 1/1', teacherId: 'T1', salt: '0e9e326b9a161f4a39fd42b3ba3a32e2', hash: '569eede7efa14ba13706632ffb4e847043587bcbbc804171283951545c4eac23', active: true, mustChangePassword: true },
  { id: 'U-MASHAEL', username: 'mashael', name: 'أ. مشاعل فايز', nameEn: 'Ms. Mashael Fayez', role: 'teacher', title: 'معلمة – رائدة فصل 2/2', titleEn: 'Teacher – Homeroom 2/2', teacherId: 'T6', salt: '49d18eac96182bea724ed9b70a346763', hash: 'f152dbe6d7eb80625eea24e591305bcddbec6e2ff19ee135c2c4e006989830b9', active: true, mustChangePassword: true },
  { id: 'U-MERAL', username: 'meral', name: 'أ. ميرال بندر', nameEn: 'Ms. Meral Bandar', role: 'teacher', title: 'معلمة – رائدة فصل 1/3', titleEn: 'Teacher – Homeroom 1/3', teacherId: 'T3', salt: '01c7bd0807592f983bbfab916b55993a', hash: 'dea1c2f95fb76fde79a5de5bd91735e89f801cd927e8bfed5e5c807e567a9dbd', active: true, mustChangePassword: true },
  { id: 'U-MUNIRA', username: 'munira', name: 'أ. منيرة الدوسري', nameEn: 'Ms. Munira Al-Dosari', role: 'safety', title: 'مسؤولة الأمن والسلامة', titleEn: 'Safety & Security Officer', salt: '6da5238f60fd77524b044fd576e5fb1d', hash: 'e652028c3fceb6f38899215542ecc054242abbe97cb35de79d541c231ada6c5c', active: true, mustChangePassword: true },
  { id: 'U-ADMIN', username: 'admin', name: 'م. دانة الحربي', nameEn: 'Eng. Dana Al-Harbi', role: 'admin', title: 'مديرة النظام', titleEn: 'System Administrator', salt: '8f89cc7290df15bf0c19b4c1e09ae2c4', hash: '8eaade2c2a46f366d944b86b0c462958c68fc6205241e4072789aa15a3f0cc8e', active: true, mustChangePassword: true },
];
