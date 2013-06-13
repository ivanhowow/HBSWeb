var HBSensorUIApp = angular.module('HBSensorUIApp', []);

HBSensorUIApp.config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider){
  $locationProvider.html5Mode(false);
  $routeProvider
    .when('/', {templateUrl: '/partials/main.html', controller: 'MainPageCtrl'})
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
            var map = [];
            _.each(data, function(prof) {
                prof.Identifier = prof.Name + "-" + prof.Faction + "-" + prof.Realm;
                map[prof.Identifier] = prof;
            });
            $scope.profileOverviews = data;
            $scope.profileMap = map;
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
    $scope.$watch('profileMap', function() {
        if (!$scope.profileMap) return;
        $scope.profile = $scope.profileMap[$scope.identifier];
        $scope.profile.EXPData = {
            title:{
                text: "EXP Gain"
            },
            data: [//array of dataSeries
                { //dataSeries object

                    /*** Change type "column" to "bar", "area", "line" or "pie"***/
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
