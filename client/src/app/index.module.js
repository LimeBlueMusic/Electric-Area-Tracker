import config from './index.config';
import routerConfig from './index.route';
import runBlock from './index.run';
import HomeController from './home/home.controller';
import PopularController from './popular/popular.controller';
import RecentController from './recent/recent.controller';
import ArtistsController from './artists/artists.controller';
import ArtistController from './artist/artist.controller';
import SongController from './song/song.controller';
import NavDirective from './nav/nav.directive';
import LinksDirective from './links/links.directive';
import baseurl from './services/baseurl';
import socket from './services/socket';
import songstream from './services/songstream';

angular.module('bpm', [
        'ngRoute',
        'btford.socket-io',
        'angular-contextual-date',
    ])
    .constant('io', io)
    .config(config)
    .config(routerConfig)
    .run(runBlock)
    .service('baseurl', baseurl)
    .service('socket', socket)
    .service('songstream', songstream)
    .controller('HomeController', HomeController)
    .controller('PopularController', PopularController)
    .controller('RecentController', RecentController)
    .controller('ArtistsController', ArtistsController)
    .controller('ArtistController', ArtistController)
    .controller('SongController', SongController)
    .directive('bpmLinks', () => new LinksDirective())
    .directive('bpmNav', () => new NavDirective());