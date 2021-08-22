function loginRequired(req, res, next) {
    if (req.session.user) {
        next();
    }
    if (!req.session.user) {
        req.flash("loginMessage", "Please login to access this page.")
        res.redirect("/login")
    }
}

function logoutRequired(req, res, next) {
    if (!req.session.user) {
        next();
    }
    if (req.session.user) {
        res.redirect('/dashboard');
    }
}

module.exports = {
    loginRequired: loginRequired,
    logoutRequired: logoutRequired
}