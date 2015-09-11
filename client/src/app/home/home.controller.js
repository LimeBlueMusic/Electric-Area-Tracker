class HomeController {
    constructor(songstream) {
        'ngInject';
        this.recent = [];
        this.unique24 = [];
        songstream.get((data) => {
            this.recent = data;
            this.mostHeard();
        });
    }
    mostHeard() {
        let songid = _.chain(this.recent).pluck('xmSongID').countBy().pairs().max(_.last).first().value();
        this.mostHeard = _.find(this.recent, 'xmSongID', songid);
        this.unique24 = _.uniq(this.recent, function(hist) {
            return hist.xmSongID;
        });
    }
}

export default HomeController;
