const local = require('./localStrategy');
const kakao = require('./kakaoStrategy');
const { User, Post } = require('../models');

module.exports = (passport) => {
    // req.session 객체에 어떤 데이터를 저장할지 선택
    passport.serializeUser((user, done) => {
        done(null, user.id);
    });

    /*
    * 매 요청시 실행 됨. passport.session() 미들웨어가 이 메소드를 호출
    * 세션에 저장된 아이디로 사용자 정보를 조회할 때 팔로잉 목록과 팔로워 목록도 같이 조회한다.
    * attributes는 비밀번호를 조회하는 것을 방지하기 위함.
    */
    passport.deserializeUser( async (id, done) => {
        try {
            const user = await User.findOne({ where: { id },
                include: [{
                    model: User,
                    attributes: ['id', 'nick'],
                    as: 'Followers',
                }, {
                    model: User,
                    attributes: ['id', 'nick'],
                    as: 'Followings',
                }, {
                    model: Post,
                    attributes: ['id', 'userId'],
                    as: 'PostLike',
                }],
            });
            done(null, user);
        } catch(error) {
            done(error);
        }
    });

    local(passport);
    kakao(passport);
}