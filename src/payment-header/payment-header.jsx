import { baseAppUrl } from "../data/services/lms/urls";

export const primaryNav = () => [
  { href: `${baseAppUrl("/")}`, content: "Trang chủ" },
  ,
  { href: `${baseAppUrl("/courses")}`, content: "Các khóa học" },
];

export const cuscLogoImgSrc = () =>
  `${baseAppUrl("/static/tutor-edx-mytheme/images/cusc-logo.png")}`;

export const ctuLogoImgSrc = () =>
  `${baseAppUrl("/static/tutor-edx-mytheme/images/ctu-logo.png")}`;
