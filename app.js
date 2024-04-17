const express = require("express");
const expressLayouts = require("express-ejs-layouts");
const cookieParser = require("cookie-parser");
const dbConnect = require("./config/dbConnect");
const methodOverride = require("method-override");

const app = express();
const port = process.env.PORT || 3000;

// db 연결
dbConnect();

// 뷰, 레이아웃, 정적파일(css) 사용
app.use(expressLayouts);
app.set("view engine", "ejs");
app.set("views", __dirname + '/views');
app.use(express.static(__dirname + '/public'));

// 파싱을 위한 코드(이게 있어야 body 사용 가능)
app.use(express.json());
app.use(express.urlencoded( {extended: true} ));

// 로그인 상태를 저장할 쿠키 사용
app.use(cookieParser());

// form에서 PUT, DELETE를 사용하기 위한 메소드 오버라이드 사용
app.use(methodOverride("_method"));

// route 파일 사용
app.use("/", require("./routes/main"));
app.use("/post", require("./routes/post"));

// 서버 가동
app.listen(port, () => {
    console.log(`App listening on port ${port}`);
})