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
    $mState,
    $stateParams,
    $ionicLoading,
    $ionicScrollDelegate,
    $ionicHistory,
    $mAuth,
    $mContextualActions,
    $mDataLoader,
    $mFrameSize,
    $http,
    $sce,
    $q
  ) {
    var baseUrl = "http://api.legiscrawler.com.br/v1";
    // var baseUrl = "http://localhost:8080/v1";

    var page = {
      LIST: 'list',
      LEGISLATION: 'legislation',
      SEARCH: 'search'
    };

    var helpers = {
      error: function(err) {
        console.error(err);
        $scope.moblet.isLoading = false;
        $scope.moblet.error = true;
        $scope.moblet.noContent = true;
      },
      successViewLoad: function() {
        // Set error and noContent to false
        $scope.moblet.error = false;
        $scope.moblet.noContent = false;

        // Remove the loader
        $scope.moblet.isLoading = false;

        // Broadcast complete refresh and infinite scroll
        $timeout(function() {
          $ionicScrollDelegate.resize();
          $rootScope.$broadcast('scroll.refreshComplete');
          $rootScope.$broadcast('scroll.infiniteScrollComplete');
        }, 500);
      },
      listHeight: function() {
        var height = parseInt($mFrameSize.height(), 10);
        return (height - 50) + "px";
      }
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
        $http.get(url, {withCredentials: false})
          .then(
            function(response) {
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
      showListView: function(category) {
        $timeout(function() {
          var query = {
            text: ''
          };
          $scope.parent = category;
          $scope.searchQuery = '';
          if (category !== null && category !== '' && typeof category !== 'undefined') {
            var search = category.split('?search=');
            if (typeof search !== 'undefined' && search.length > 1) {
              $scope.searchQuery = search[1];
              query.text = search[1];
            }
          }
          legislationModel.getLegislation(category)
          .then(function(data) {
            if (isDefined(data)) {
              // Put the data in the $scope
              $scope.data = data;
              if (data.length === 0) {
                $scope.noData = true;
              }
              $scope.query = query;
              helpers.successViewLoad();
            } else {
              helpers.error('list not loaded');
            }
          }).catch(function(err) {
            helpers.error(err);
          });
        }, 500);
      },
      showLegislationView: function(endpoint) {
        $timeout(function() {
          var query = {
            text: ''
          };
          var mark = endpoint.split('#mark-');
          var search = '';
          $scope.baseIframeUrl = endpoint;
          if (typeof mark !== 'undefined' && mark.length > 1) {
            search = mark[0].split('?search=');
            $scope.mark = mark[1];
            $scope.baseIframeUrl = baseUrl + mark[0];
          } else {
            search = endpoint.split('?search=');
          }
          if (typeof search !== 'undefined' && search.length > 1) {
            query.text = search[1];
          }

          $timeout(function() {
            $scope.iFrameUrl = $sce.trustAsResourceUrl(baseUrl + endpoint);
            $scope.query = query;
            helpers.successViewLoad();
          }, 1000);
        }, 500);
      },
      search: function(query, iFrameUrl) {
        var searchQuery = ($scope.parent || '') + '?search=' + query.text;
        if ($scope.view === page.LEGISLATION) {
          $scope.moblet.isLoading = true;
          var url = $sce.getTrusted('url', iFrameUrl).split('?search=')[0];

          $scope.baseIframeUrl = url + searchQuery;
          $scope.mark = 0;
          $scope.iFrameUrl = $sce.trustAsResourceUrl($scope.baseIframeUrl + '#mark-' + $scope.mark);
          $timeout(function() {
            helpers.successViewLoad();
          }, 100);
        } else {
          $stateParams.detail = page.SEARCH + '&' + searchQuery;
          // console.log($stateParams);
          $mState.go('u-moblets', 'page', $stateParams);
        }
      },
      goTo: function(item, markId) {
        markId = markId || false;
        var searchQuery = $scope.searchQuery || false;
        var parent = item.parent === '/' ? '' : item.parent;
        // type === LIST
        if (item.type === 'LIST') {
          $stateParams.detail = page.LIST + '&' + parent + '/' + item.slug;
          $mState.go('u-moblets', 'page', $stateParams);
          // $state.go('pages', $stateParams);
				// type === LEGISLATION
        } else {
          var detail = page.LEGISLATION + '&' + parent + '/l/' + item.slug;
          if (searchQuery) {
            detail += '?search=' + searchQuery;
          }
          if (markId) {
            detail += '#mark-' + markId;
          }

          $stateParams.detail = detail;
          $mState.go('u-moblets', 'page', $stateParams);
          // $state.go('pages', $stateParams);
        }
      },
      scrollTo(legislation, markId) {
        controller.goTo(legislation, markId);
      },
      nextMark() {
        if ($scope.query.text) {
          $scope.mark = Number($scope.mark) + 1;
          $scope.iFrameUrl = $sce.trustAsResourceUrl($scope.baseIframeUrl + '#mark-' + $scope.mark);
        }
      },
      previousMark() {
        if ($scope.query.text && $scope.mark > 0) {
          $scope.mark = Number($scope.mark) - 1;
          $scope.iFrameUrl = $sce.trustAsResourceUrl($scope.baseIframeUrl + '#mark-' + $scope.mark);
        }
      }
    };

    var router = function() {
      // Set general status
      $scope.moblet.isLoading = true;
      appModel.loadInstanceData()
        .then(function() {
          var detail = $stateParams.detail.split('&');
          $scope.view = detail[0] === '' ? page.LIST : detail[0];
          if ($scope.view === page.LIST || $scope.view === page.SEARCH) {
            controller.showListView(detail[1] || null);
          } else {
            controller.showLegislationView(detail[1] || null);
          }

          // Make the general functions avalable in the scope
          $scope.listHeight = helpers.listHeight();
          $scope.goTo = controller.goTo;
          $scope.scrollTo = controller.scrollTo;
          $scope.nextMark = controller.nextMark;
          $scope.previousMark = controller.previousMark;
          $scope.search = controller.search;
          $scope.query = {
            text: ''
          };
          $scope.noData = false;
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
