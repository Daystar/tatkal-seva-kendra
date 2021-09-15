exports.showPricing = function (req, res) {
    if (req.session.user) {
        res.render('pricing', { username: req.session.user.username })
    } else {
        res.render('guestpricing')
    }
}