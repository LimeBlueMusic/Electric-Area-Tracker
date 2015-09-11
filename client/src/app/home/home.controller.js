class HomeController {
    constructor(songstream, _) {
        'ngInject';
        this.recent = [];
        this.unique24 = [];
        songstream.get((data) => {
            this.recent = data;
            this.mostHeard();
        });
        this._ = _;
    }
    mostHeard() {
        let songid = this._.chain(this.recent).pluck('xmSongID').countBy().pairs().max(this._.last).first().value();
        this.mostHeard = this._.find(this.recent, 'xmSongID', songid);
        this.unique24 = this._.uniq(this.recent, function(hist) {
            return hist.xmSongID;
        });
    }
}

export default HomeController;
