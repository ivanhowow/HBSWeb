var HBSensorUIApp = angular.module('HBSensorUIApp', []);
HBSensorUIApp.value('$anchorScroll', angular.noop)

HBSensorUIApp
  .config(function($httpProvider){
    console.log(">>>");
    console.log($httpProvider.defaults.headers);
    delete $httpProvider.defaults.headers.common['X-Requested-With'];

});

HBSensorUIApp.config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider){
  $locationProvider.html5Mode(false);
  $routeProvider
    .when('/', {templateUrl: '/partials/main.html', controller: 'MainPageCtrl'})
    .when('/login', {templateUrl: '/partials/login.html', controller: 'LoginCtrl'})
    .when('/logout', {templateUrl: '/partials/logout.html', controller: 'LogoutCtrl'})
    .when('/view/:identifier', {templateUrl: '/partials/view-toon.html', controller: 'ViewToonPageCtrl'})
    .otherwise({redirectTo: '/'})
    ;
}]);

HBSensorUIApp.run(['$rootScope', '$location', '$route', function($rootScope, $location, $route) {
  $rootScope.$on('$routeChangeSuccess', function(event, next) {
    $rootScope.show_loading_indicator = false;
    if (amplify.store("hbs.web.apikey") && amplify.store("hbs.web.dbname")) {
        $rootScope.is_logged_in = true;
    }
    if ((!amplify.store("hbs.web.apikey") || !amplify.store("hbs.web.dbname")) && $location.path() != '/login' && (
      next.$$route.templateUrl != '/partials/login.html'
      )) {
      $rootScope.is_logged_in = false;
      $location.path("/login");
    }
  });
}]);

function LogoutCtrl($scope, $http, $rootScope, $location) {
    amplify.store("hbs.web.apikey", null);
    amplify.store("hbs.web.dbname", null);
    $rootScope.profileOverviews = false;
    $rootScope.profileMap = false;
    $location.path("/");
}

function LoginCtrl($scope, $http, $rootScope, $location) {
    $scope.connectionParams = {};
    $scope.error = false;
    $scope.info = false;
    $scope.lockinput = false;
    $scope.connectionParams.apikey = "IuSZa5QEDp9koUOU11i_L6Dj-8VDn7z1";
    $scope.connectionParams.dbname = "hbsensor";
    $scope.connect = function() {
        if (!$scope.connectionParams.apikey || !$scope.connectionParams.dbname) {
            $scope.error = "Please key in your API Key and Database name";
            return;
        }
        $scope.info = "Connecting...";
        $scope.error = false;
        $scope.lockinput = true;
        //IuSZa5QEDp9koUOU11i_L6Dj-8VDn7z1
        //hbsensor
        $http.get('https://api.mongolab.com/api/1/databases/' + $scope.connectionParams.dbname + '/collections?apiKey=' + $scope.connectionParams.apikey)
        .success(function(data, status) {
            if (data && _.contains(data, "system.users")) {
                $scope.info = "Connected";
                amplify.store("hbs.web.apikey", $scope.connectionParams.apikey);
                amplify.store("hbs.web.dbname", $scope.connectionParams.dbname);
                $rootScope.reloadData();
                $location.path("/");
            } else {
                $scope.lockinput = false;
                $scope.info = false;
                $scope.error = "Connection failed. Please check your API Key and Database Name.";
            }
        })
        .error(function(data, status) {
            $scope.lockinput = false;
            $scope.info = false;
            $scope.error = "Connection failed. Please check your API Key and Database Name.";
        })
    }
}


function HBSensorUIAppCtrl($scope, $http, $rootScope, $location, $timeout) {

    $rootScope.reloadData = function() {
        $scope.loadOverview();
    }

    $scope.loadOverview = function() {
        $http.get('https://api.mongolab.com/api/1/databases/hbsensor/collections/ProfileOverview?apiKey=IuSZa5QEDp9koUOU11i_L6Dj-8VDn7z1')
        .success(function(data, status) {
            var map = [];
            _.each(data, function(prof) {
                prof.Identifier = prof.Name + "-" + prof.Faction + "-" + prof.Realm;
                map[prof.Identifier] = prof;
                prof.Avatar = false;
                if (amplify.store("hbs.web.wowcache." + prof.Identifier)) {
                    console.log("Getting WoWCache from cache");
                    prof.WoWCache = amplify.store("hbs.web.wowcache." + prof.Identifier);
                    prof.TN = "http://us.battle.net/static-render/us/" + prof.WoWCache.thumbnail;
                } else {
                    $timeout(function() {
                        console.log("Requesting WoWCache from server");
                        $http.jsonp('http://us.battle.net/api/wow/character/' + prof.Realm + '/' + prof.Name+ '?jsonp=JSON_CALLBACK')
                        .success(function(data) {
                            amplify.store("hbs.web.wowcache." + prof.Identifier, data);
                            prof.WoWCache = data;
                            prof.TN = "http://us.battle.net/static-render/us/" + prof.WoWCache.thumbnail;
                        });
                    }, 0);
                }
            });
            $rootScope.profileOverviews = data;
            $rootScope.profileMap = map;
            //http://us.battle.net/api/wow/character/saurfang/lirienne
            //http://us.battle.net/static-render/us/saurfang/219/96037083-avatar.jpg
            //cache using amplify?
        })
        .error(function(data, status) {
            alert("Unable to load data");
            console.log("Unable to fetch overview");
        });
    }

    if (!amplify.store("hbs.web.apikey") || !amplify.store("hbs.web.dbname")) {
        $location.path("/login");
        return;
    }

    $scope.loadOverview();
}

function MainPageCtrl($scope, $http, $rootScope) {
}

function ViewToonPageCtrl($scope, $http, $rootScope, $routeParams) {
    $scope.identifier = $routeParams.identifier;
    $scope.$watch('profileMap', function() {
        if (!$scope.profileMap) return;
        $scope.profile = $scope.profileMap[$scope.identifier];
        $scope.profile.EXPData = {};
        $scope.profile.EXPData.LastHour = {
            title:{
                text: "Last Hour"
            },
            data: [
                {
                    type: "spline",
                    dataPoints: [
                        { x: new Date(2012, 00, 1), y: 1352 },
                        { x: new Date(2012, 01, 1), y: 1514 },
                        { x: new Date(2012, 02, 1), y: 1321 },
                        { x: new Date(2012, 03, 1), y: 1163 },
                        { x: new Date(2012, 04, 1), y: 950 },
                        { x: new Date(2012, 05, 1), y: 1201 },
                        { x: new Date(2012, 06, 1), y: 1186 },
                        { x: new Date(2012, 07, 1), y: 1281 },
                        { x: new Date(2012, 08, 1), y: 1438 },
                        { x: new Date(2012, 09, 1), y: 1305 },
                        { x: new Date(2012, 10, 1), y: 1480 },
                        { x: new Date(2012, 11, 1), y: 1291 },
                    ]
                }
            ]
        };

        $scope.profile.EXPData.LastDay = {
            title:{
                text: "Last 24 Hours"
            },
            data: [
                {
                    type: "spline",
                    dataPoints: [
                        { x: new Date(2012, 00, 1), y: 1352 },
                        { x: new Date(2012, 01, 1), y: 1514 },
                        { x: new Date(2012, 02, 1), y: 1321 },
                        { x: new Date(2012, 03, 1), y: 1163 },
                        { x: new Date(2012, 04, 1), y: 950 },
                        { x: new Date(2012, 05, 1), y: 1201 },
                        { x: new Date(2012, 06, 1), y: 1186 },
                        { x: new Date(2012, 07, 1), y: 1281 },
                        { x: new Date(2012, 08, 1), y: 1438 },
                        { x: new Date(2012, 09, 1), y: 1305 },
                        { x: new Date(2012, 10, 1), y: 1480 },
                        { x: new Date(2012, 11, 1), y: 1291 },
                    ]
                }
            ]
        };

        $scope.profile.EXPData.LastWeek = {
            title:{
                text: "Last Week"
            },
            data: [
                {
                    type: "spline",
                    dataPoints: [
                        { x: new Date(2012, 00, 1), y: 1352 },
                        { x: new Date(2012, 01, 1), y: 1514 },
                        { x: new Date(2012, 02, 1), y: 1321 },
                        { x: new Date(2012, 03, 1), y: 1163 },
                        { x: new Date(2012, 04, 1), y: 950 },
                        { x: new Date(2012, 05, 1), y: 1201 },
                        { x: new Date(2012, 06, 1), y: 1186 },
                        { x: new Date(2012, 07, 1), y: 1281 },
                        { x: new Date(2012, 08, 1), y: 1438 },
                        { x: new Date(2012, 09, 1), y: 1305 },
                        { x: new Date(2012, 10, 1), y: 1480 },
                        { x: new Date(2012, 11, 1), y: 1291 },
                    ]
                }
            ]
        };
        $scope.profile.GoldData = {
            title:{
                text: "Gold Gain"
            },
            data: [
                {
                    type: "spline",
                    dataPoints: [
                        { x: new Date(2012, 00, 1), y: 1352 },
                        { x: new Date(2012, 01, 1), y: 1514 },
                        { x: new Date(2012, 02, 1), y: 1321 },
                        { x: new Date(2012, 03, 1), y: 1163 },
                        { x: new Date(2012, 04, 1), y: 950 },
                        { x: new Date(2012, 05, 1), y: 1201 },
                        { x: new Date(2012, 06, 1), y: 1186 },
                        { x: new Date(2012, 07, 1), y: 1281 },
                        { x: new Date(2012, 08, 1), y: 1438 },
                        { x: new Date(2012, 09, 1), y: 1305 },
                        { x: new Date(2012, 10, 1), y: 1480 },
                        { x: new Date(2012, 11, 1), y: 1291 },
                    ]
                }
            ]
        };



    });
}


HBSensorUIApp.directive('chart', function() {
  return {
    restrict: 'A',
    scope: {chartdata: '='},
    link: function(scope, element, attrs) {
        scope.$watch('chartdata', function() {
            if (!scope.chartdata) return;
            var chartElement = $(element);
            if (!chartElement.attr("id")) {
                chartElement.attr("id", _.uniqueId('chart_'));
            }
            var chart = new CanvasJS.Chart(chartElement.attr("id"), scope.chartdata);

            chart.render();
        });
    }
  }
})
