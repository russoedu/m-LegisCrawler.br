/* eslint no-undef: [0]*/
module.exports = {
  title: "mLegiscrawlerBr",
  style: "m-legiscrawler-br.less",
  template: 'm-legiscrawler-br.html',
  i18n: {
    pt: "lang/pt-BR.json"
  },
  link: function() {},
  controller: function(
    $scope,
    $rootScope,
    $timeout,
    $state,
    $stateParams,
    $ionicLoading,
    $ionicScrollDelegate,
    $ionicHistory,
    $mAuth,
    $mContextualActions,
    $mDataLoader,
    $mFrameSize,
    $http,
    $q
  ) {
    var baseUrl = "http://api.legiscrawler.com.br/v1";

    var page = {
      LIST: 'list',
      LEGISLATION: 'legislation',
      SEARCH: 'search'
    };

    var helpers = {
      error: function(err) {
        console.error(err);
        $scope.isLoading = false;
        $scope.error = true;
        $scope.noContent = true;
      },
      successViewLoad: function() {
        // Set error and noContent to false
        $scope.error = false;
        $scope.noContent = false;

        // Remove the loader
        $scope.isLoading = false;

        // Broadcast complete refresh and infinite scroll
        $rootScope.$broadcast('scroll.refreshComplete');
        $rootScope.$broadcast('scroll.infiniteScrollComplete');
      },
      listHeight: function() {
        var height = parseInt($mFrameSize.height(), 10);
        return (height - 50) + "px";
      },
    };

    var appModel = {
      loadInstanceData: function() {
        var deferred = $q.defer();
        var dataLoadOptions = {
          cache: ($stateParams.detail !== "")
        };

        $mDataLoader.load($scope.moblet, dataLoadOptions)
          .then(function(data) {
            $scope.listStyle = data.listStyle;
            $scope.legislationStyle = data.legislationStyle;
            $scope.articleStyle = data.articleStyle;
            deferred.resolve();
          })
          .catch(function(err) {
            helpers.error(err);
            deferred.reject(err);
          });
        return deferred.promise;
      }
    };

    var legislationModel = {
      getLegislation: function(legislation) {
        var deferred = $q.defer();
        var url = baseUrl + (legislation || '');
        console.log(url);
        $http.get(url)
          .then(
            function(response) {
              console.log(response.data);
              deferred.resolve(response.data);
            },
            function(err) {
              helpers.error(err);
              deferred.reject(err);
            }
        );
        return deferred.promise;
      }
    };

    var controller = {
      /**
      * Put the legislation OR the list of legislations and lists in the $scope.data
      * @param {String} category The category or null to retrieve the home of the API
      */
      showView: function(category) {
        $scope.parent = category;
        legislationModel.getLegislation(category)
          .then(function(data) {
            if (isDefined(data)) {
              // Put the data in the $scope
              $scope.data = data;
              helpers.successViewLoad();
            } else {
              helpers.error('list not loaded');
            }
          }).catch(function(err) {
            helpers.error(err);
          });
      },
      goTo: function(item) {
				console.log(item);
				// type === LIST
				var parent = item.parent === '/' ? '' : item.parent;
        console.log(parent);
        if (item.type === 'LIST') {
          $stateParams.detail = page.LIST + '&' + parent + '/' + item.slug;
				// type === LEGISLATION
        } else {
          $stateParams.detail = page.LEGISLATION + '&' + parent + '/l/' + item.slug;
        }
        console.log($stateParams.detail);
        $state.go('pages', $stateParams);
      },
      scrollTo(legislation, markId) {
        console.log(legislation, markId);
        controller.goTo(legislation);
      },
      search: function(query) {
        var searchQuery = ($scope.parent || '') + '?search=' + query.text;
        $stateParams.detail = page.SEARCH + '&' + searchQuery;
        console.log($stateParams);
        $state.go('pages', $stateParams);
      }
    };

    var router = function() {
      // Set general status
      $scope.isLoading = true;
      appModel.loadInstanceData()
        .then(function() {
          var detail = $stateParams.detail.split('&');
          $scope.view = detail[0] === '' ? page.LIST : detail[0];

          controller.showView(detail[1] || null);

          // Make the general functions avalable in the scope
          $scope.listHeight = helpers.listHeight();
          $scope.goTo = controller.goTo;
          $scope.scrollTo = controller.scrollTo;
          $scope.search = controller.search;
          $scope.query = {
            text: ''
          };
        })
        .catch(function(err) {
          helpers.error(err);
        });
    };

    router();

  // // CLEAR CONSOLE
  // if (typeof console._commandLineAPI !== 'undefined') {
  //   console.API = console._commandLineAPI; // chrome
  // } else if (typeof console._inspectorCommandLineAPI !== 'undefined') {
  //   console.API = console._inspectorCommandLineAPI; // Safari
  // } else if (typeof console.clear !== 'undefined') {
  //   console.API = console;
  // }
  //
  // console.API.clear();
  }
};
