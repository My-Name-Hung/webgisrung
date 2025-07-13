export const layoutSteps = [
  {
    selector: '[data-tour="layout"]',
    content: "Chào mừng bạn đến với Hệ thống quản lý rừng!",
    position: "center",
  },
  {
    selector: '[data-tour="sidebar"]',
    content:
      "Thanh điều hướng chính của hệ thống, giúp bạn truy cập các chức năng khác nhau",
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
    selector: ".stats-grid-dashboard",
    content:
      "Thống kê tổng quan về diện tích rừng, điểm quan trắc và kế hoạch quy hoạch",
  },
  {
    selector: ".charts-grid-dashboard",
    content:
      "Biểu đồ thống kê về diện tích theo loại rừng, chất lượng rừng và chỉ số phát triển theo năm",
  },
];

export const forestMapSteps = [
  {
    selector: ".form-section-forestmap",
    content:
      "Khu vực tải lên bản đồ mới. Bạn có thể tải lên file GeoJSON, CSV hoặc Shapefile",
  },
  {
    selector: ".preview-section-forestmap",
    content:
      "Xem trước bản đồ trước khi tải lên. Bạn có thể kiểm tra dữ liệu và vị trí trên bản đồ",
  },
];

export const monitoringSteps = [
  {
    selector: ".form-section-monitoringpoints",
    content:
      "Thêm điểm quan trắc mới với thông tin về tên, loại, trạng thái và tọa độ",
  },
  {
    selector: ".preview-section-monitoringpoints",
    content:
      "Xem trước vị trí điểm quan trắc trên bản đồ và thông tin chi tiết",
  },
];

export const forestIndicesSteps = [
  {
    selector: ".form-section-forestindices",
    content:
      "Thêm chỉ số rừng mới với thông tin về tên, giá trị, đơn vị, năm và danh mục",
  },
  {
    selector: ".preview-section-forestindices",
    content: "Xem trước dữ liệu dưới dạng biểu đồ và bảng thông tin chi tiết",
  },
];

export const forestStatusSteps = [
  {
    selector: ".form-section-foreststatus",
    content:
      "Thêm hiện trạng rừng mới với thông tin về loại rừng, diện tích, chất lượng và ngày khảo sát",
  },
  {
    selector: ".preview-section-foreststatus",
    content: "Xem trước dữ liệu hiện trạng với biểu đồ và thông tin chi tiết",
  },
];

export const forestPlanningSteps = [
  {
    selector: ".form-section-forestplanning",
    content:
      "Thêm quy hoạch rừng mới với thông tin về tên, diện tích, loại quy hoạch và thời gian thực hiện",
  },
  {
    selector: ".preview-section-forestplanning",
    content:
      "Xem trước thông tin quy hoạch với các chi tiết về kế hoạch thực hiện",
  },
];

export const userModalSteps = [
  {
    selector: ".user-modal-content",
    content: "Quản lý thông tin tài khoản cá nhân và cài đặt hệ thống",
    position: "center",
  },
  {
    selector: ".user-modal-tabs",
    content: "Chuyển đổi giữa xem thông tin và đổi mật khẩu",
    position: "bottom",
  },
  {
    selector: ".user-modal-theme-switch",
    content: "Tùy chỉnh giao diện sáng/tối theo sở thích",
    position: "left",
  },
];
