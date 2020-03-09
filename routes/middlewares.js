const jwt = require('jsonwebtoken');


// 로그인 유무 체크 로그인시, false시 에러
exports.isLoggedIn = (req, res, next) => {
    if (req.isAuthenticated()) {
        next();
    } else {
        res.status(403).send('로그인 필요');
    }
};

// 로그인 아닌지 유무 체크, false시 '/'로 리다이렉트
exports.isNotLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated()) {
        next();
    } else {
        res.redirect('/');
    }
}

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