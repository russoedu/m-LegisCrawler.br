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
    $ionicScrollDelegate,
    $mDataLoader,
    $mFrameSize,
    $http,
    $q
  ) {
    var baseUrl = "https://legiscrawler.com.br:4433/v1/";

    var page = {
      LIST: 'list',
      LEGISLATION: 'legislation',
      ARTICLE: 'article'
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
      }
    // removeAccents: function(value) {
    //   value = value
    //     .toLowerCase()
    //     .replace(
    //       /(\u0061[\u0300\u0301\u0302\u0303\u0304\u0305]|[áàâãä])/g,
    //       'a')
    //     .replace(
    //       /(\u0065[\u0300\u0301\u0302\u0303\u0304\u0305]|[éèêë])/g,
    //       'e')
    //     .replace(
    //       /(\u0069[\u0300\u0301\u0302\u0303\u0304\u0305]|[íìîï])/g,
    //       'i')
    //     .replace(
    //       /(\u006F[\u0300\u0301\u0302\u0303\u0304\u0305]|[óòôõö])/g,
    //       'o')
    //     .replace(
    //       /(\u0075[\u0300\u0301\u0302\u0303\u0304\u0305]|[úùûü])/g,
    //       'u')
    //     .replace(
    //       /(\u0063\u0327|ç)/g,
    //       'c');
    //   return value;
    // },
    // updateSearch: function(text) {
    //   $scope.searchText = text;
    // },
    // search: function(item) {
    //   if (!$scope.searchText) {
    //     return true;
    //   }
    //   if (typeof item === 'object') {
    //     item = 'Artigo ' + item.number + ' ' + item.article;
    //   }
    //
    //   var text = helpers.removeAccents(item);
    //   var search = helpers.removeAccents($scope.searchText);
    //
    //   $timeout(function() {
    //     // Broadcast complete refresh and infinite scroll
    //     $ionicScrollDelegate.scrollTop();
    //     $rootScope.$broadcast('scroll.refreshComplete');
    //     $rootScope.$broadcast('scroll.infiniteScrollComplete');
    //   }, 100);
    //   return text.indexOf(search) > -1;
    // }
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
        $http.get(baseUrl + (legislation || ''))
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

    var listController = {
      /**
      * Show the moblet main view
      */
      showView: function() {
        legislationModel.getLegislation()
          .then(function(list) {
            if (isDefined(list) && list.length > 0) {
              // Put the list in the $scope
              $scope.list = list;

              // Add functions to the scope
              $scope.goToLegislation = listController.goToLegislation;

              helpers.successViewLoad();
            } else {
              helpers.error('list not loaded');
            }
          }).catch(function(err) {
            helpers.error(err);
          });
      },
      goToLegislation: function(legislation) {
        $stateParams.detail = page.LEGISLATION + '&' + legislation;
        $state.go('pages', $stateParams);
      }
    };

    var legislationController = {
      showView: function(legislation) {
        $scope.isLoading = true;
        legislationModel.getLegislation(legislation)
          .then(function(legislation) {
            $timeout(function() {
              // Put the data in the $scope
              $scope.legislation = legislation.data;
              $rootScope.legislation = legislation.data;
              $scope.legislationType = legislation.type;
              $rootScope.legislationType = legislation.type;

              // Add functions to the scope
              $scope.goToArticle = legislationController.goToArticle;

              helpers.successViewLoad();
            }, 500);
          }).catch(function(err) {
            helpers.error(err);
          });
      },
      goToArticle: function(legislationType, article) {
        $stateParams.detail = page.ARTICLE + '&' + legislationType + '&' + article;
        $state.go('pages', $stateParams);
      }
    };

    var articleController = {
      showView: function(legislationType, articleNumber) {
        $scope.isLoading = true;
        if ($rootScope.legislationType === legislationType) {
          $timeout(function() {
            // Put the data in the $scope
            $scope.legislationType = legislationType;
            $scope.article = $rootScope.legislation.filter(function(obj) {
              return obj.number === articleNumber;
            })[0].article;
            // $scope.article = $rootScope.legislation[article].article;
            $scope.number = articleNumber;

            helpers.successViewLoad();
          }, 500);
        } else {
          helpers.error();
        }
      }
    };

    var router = function() {
      // Set general status
      $scope.isLoading = true;
      appModel.loadInstanceData()
        .then(function() {
          // Make the general functions avalable in the scope
          $scope.listHeight = helpers.listHeight();

          var detail = $stateParams.detail.split('&');
          $scope.view = detail[0] === '' ? page.LIST : detail[0];

          // Decide where to go based on the $stateParams
          if ($scope.view === page.LIST) {
            listController.showView();
          } else if ($scope.view === page.LEGISLATION) {
            /** PRODUCT PAGE **/
            legislationController.showView(detail[1]);
          } else if ($scope.view === page.ARTICLE) {
            /** CATEGORY PAGE **/
            articleController.showView(detail[1], detail[2]);
          }
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
