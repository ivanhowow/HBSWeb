var HBSensorUIApp = angular.module('HBSensorUIApp', []);

HBSensorUIApp.config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider){
  $locationProvider.html5Mode(false);
  $routeProvider
    .when('/', {templateUrl: '/partials/carousel.html', controller: 'MainPageCtrl'})
    .when('/view/:identifier', {templateUrl: '/partials/view-toon.html', controller: 'ViewToonPageCtrl'})
    .otherwise({redirectTo: '/'})
    ;
}]);

function HBSensorUIAppCtrl($scope, $http, $rootScope) {

    $scope.reloadData = function() {
        $scope.loadOverview();
    }

    $scope.loadOverview = function() {
        $http.get('https://api.mongolab.com/api/1/databases/hbsensor/collections/ProfileOverview?apiKey=IuSZa5QEDp9koUOU11i_L6Dj-8VDn7z1')
        .success(function(data, status) {
            console.log("Overview:");
            console.dir(data);
            _.each(data, function(prof) {
                prof.Identifier = prof.Name + "-" + prof.Faction + "-" + prof.Realm;
            });
            $scope.profileOverviews = data;
            $scope.profileMap = [];
            _.each(data, function(prof) {
                $scope.profileMap[prof.Identifier] = prof;
            });
            //http://us.battle.net/api/wow/character/saurfang/lirienne
            //http://us.battle.net/static-render/us/saurfang/219/96037083-avatar.jpg
            //cache using amplify?
        })
        .error(function(data, status) {
            //alert("Unable to load data");
            console.log("Unable to fetch overview");
        });
    }


    $scope.loadOverview();

}

function MainPageCtrl($scope, $http, $rootScope) {


}

function ViewToonPageCtrl($scope, $http, $rootScope, $routeParams) {
    $scope.identifier = $routeParams.identifier;
    $scope.$watch('profileOverviews', function() {
        if (!$scope.profileOverviews) return;
        $scope.profile = $scope.profileMap[$scope.identifier];
    });
}
