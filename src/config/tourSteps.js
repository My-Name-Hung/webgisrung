export const layoutSteps = [
  {
    selector: '[data-tour="layout"]',
    content: "Chào mừng bạn đến với Hệ thống quản lý rừng!",
    position: "center",
  },
  {
    selector: '[data-tour="sidebarHeader"]',
    content: "Đây là thanh điều hướng chính của hệ thống",
    position: "right",
  },
  {
    selector: '[data-tour="userInfo"]',
    content: "Quản lý thông tin tài khoản và cài đặt của bạn",
    position: "top",
  },
];

export const dashboardSteps = [
  {
    selector: '[data-tour="statsGrid"]',
    content:
      "Thống kê tổng quan về diện tích rừng, điểm quan trắc và kế hoạch quy hoạch.",
  },
  {
    selector: '[data-tour="chartsGrid"]',
    content:
      "Biểu đồ thống kê về diện tích theo loại rừng, chất lượng rừng và chỉ số phát triển theo năm.",
  },
];

export const forestMapSteps = [
  {
    selector: ".uploadSection",
    content:
      "Khu vực tải lên bản đồ mới. Bạn có thể tải lên file GeoJSON với thông tin tên và loại bản đồ.",
  },
  {
    selector: ".mapList",
    content:
      "Danh sách các bản đồ đã tải lên. Bạn có thể xem thông tin và xóa bản đồ tại đây.",
  },
];

export const monitoringSteps = [
  {
    selector: ".formSection",
    content:
      "Thêm điểm quan trắc mới với thông tin về tên, loại, trạng thái và tọa độ.",
  },
  {
    selector: ".pointsList",
    content:
      "Danh sách các điểm quan trắc hiện có. Bạn có thể xem, sửa và xóa điểm quan trắc tại đây.",
  },
];

export const forestIndicesSteps = [
  {
    selector: ".formSection",
    content:
      "Thêm chỉ số rừng mới với thông tin về tên, giá trị, đơn vị, năm và danh mục.",
  },
  {
    selector: ".chartSection",
    content: "Biểu đồ thể hiện sự thay đổi của các chỉ số theo thời gian.",
  },
  {
    selector: ".indicesList",
    content: "Danh sách các chỉ số rừng đã được ghi nhận.",
  },
];

export const forestStatusSteps = [
  {
    selector: ".formSection",
    content:
      "Thêm hiện trạng rừng mới với thông tin về loại rừng, diện tích, chất lượng và ngày khảo sát.",
  },
  {
    selector: ".chartSection",
    content: "Biểu đồ thể hiện diện tích theo từng loại rừng.",
  },
  {
    selector: ".statusList",
    content:
      "Danh sách hiện trạng rừng với thông tin chi tiết về từng khu vực.",
  },
];

export const forestPlanningSteps = [
  {
    selector: ".formSection",
    content:
      "Thêm quy hoạch rừng mới với thông tin về tên, diện tích, loại quy hoạch và thời gian thực hiện.",
  },
  {
    selector: ".planningList",
    content:
      "Danh sách các quy hoạch rừng với thông tin chi tiết và trạng thái thực hiện.",
  },
];

export const userModalSteps = [
  {
    selector: '[data-tour="modalContent"]',
    content: "Quản lý thông tin tài khoản cá nhân và cài đặt hệ thống",
    position: "center",
    scrollIntoView: false,
  },
  {
    selector: '[data-tour="userTabs"]',
    content: "Chuyển đổi giữa xem thông tin và đổi mật khẩu",
    position: "bottom",
    scrollIntoView: true,
  },
  {
    selector: '[data-tour="themeSwitch"]',
    content: "Tùy chỉnh giao diện sáng/tối theo sở thích",
    position: "left",
    scrollIntoView: true,
  },
];
