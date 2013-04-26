
function redirectAuth() {
    var uriBase =
}

function checkAuth(req, res, next) {
    if (req.session.email) {
        next();
    } else {
        redirectAuth(res);
    }
}

exports.checkAuth = checkAuth;