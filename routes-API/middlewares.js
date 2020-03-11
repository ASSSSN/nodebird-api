
const jwt = require('jsonwebtoken');
const RateLimit = require('express-rate-limit');

// 토큰을 검증한다. 유효기간 초과, 유효하지 않을 때를 걸러냄.
exports.verifyToken = (req, res, next) => {
    try {
        req.decoded = jwt.verify(req.headers.authorization, process.env.JWT_SECRET);
        return next();
    } catch (error) {

        // 유효 기간 초기화 시
        if (error.name === 'TokenExpiredError') {
            return res.status(419).json({
                code: 419,
                message: '토큰이 만료되었습니다.',
            });
        }

        return res.status(401).json({
            code: 401,
            message: '유효하지 않은 토큰입니다.',
        });
    }
};

/* 
* 사용량 제한을 거는 미들웨어를 생성한다. 미들웨어의 옵션으로 windowMs(기준시간), 
* max(허용횟수), delayMs(호출 간격), handler(제한 초과시 콜백 함수) 등이 있다.
* 1분에 한 번 호출 가능하게 되어있다.
*/
exports.apiLimiter = new RateLimit({
    windowMs: 60 * 1000,
    max: 1,
    delayMs: 0,
    handler(req, res) {
        res.status(this.statusCode).json({
            code: this.statusCode,
            message: '1분에 한 번만 요청할 수 있습니다.',
        });
    },
});

// 사용하면 안되는 라우터에 사용, 새로운 버전을 사용하라고 메세지 보냄
exports.deprecated = (req, res) => {
    res.status(410).json({
        code: 410,
        message: '새로운 버전이 나왔습니다. 새로운 버전을 사용하세요.',
    });
}