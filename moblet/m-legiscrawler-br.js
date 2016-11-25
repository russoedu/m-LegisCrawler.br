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
    var baseUrl = "http://legiscrawler.com.br/v1/";

    var page = {
      LIST: 'list',
      CATEGORY: 'category',
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
      },
      goToCategoryOrLegislation: function(item) {
        if (item.link === 'category') {
          $stateParams.detail = page.CATEGORY;
        } else {
          $stateParams.detail = page.LEGISLATION;
        }
        $stateParams.detail += '&' + item.category;
        $state.go('pages', $stateParams);
      },
      goToLegislation: function(legislation) {
        $stateParams.detail = page.LEGISLATION + '&' + legislation;
        $state.go('pages', $stateParams);
      },
      goToArticle: function(legislationName, article) {
        $stateParams.detail = page.ARTICLE + '&' + legislationName + '&' + article;
        $state.go('pages', $stateParams);
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
      * @param {String} category The category
      */
      showView: function(category) {
        show = function() {
          // Add functions to the scope
          if (category === undefined) {
            var categories = [];
            for (var i = 0; i < $scope.list.length; i++) {
              var cat = $scope.list[i].category;
              var constRegEx = /Constituição/;
              if (cat.match(constRegEx)) {
                categories.unshift({
                  category: cat,
                  link: 'legislation'
                });
              } else {
                cat = {
                  category: cat + 's',
                  link: 'category'
                };
                var newCat = true;
                for (var j = 0; j < categories.length; j++) {
                  if (categories[j].category === cat.category) {
                    newCat = false;
                  }
                }
                if (newCat) {
                  categories.push(cat);
                }
              }
            }
            $scope.categories = categories;
          } else {
            var categoryList = [];
            for (var k = 0; k < $scope.list.length; k++) {
              var cate = $scope.list[k].category;
              if (cate + 's' === category) {
                categoryList.push($scope.list[k].name);
              }
            }
            $scope.categoryList = categoryList;
          }
          helpers.successViewLoad();
        };

        if ($scope.list === undefined) {
          legislationModel.getLegislation()
            .then(function(list) {
              if (isDefined(list) && list.length > 0) {
                // Put the list in the $scope
                $scope.list = list;

                show();
              } else {
                helpers.error('list not loaded');
              }
            }).catch(function(err) {
              helpers.error(err);
            });
        } else {
          show();
        }
      }
    };

    var legislationController = {
      showView: function(legislation) {
        $scope.isLoading = true;
        legislationModel.getLegislation(legislation)
          .then(function(legislation) {
            $timeout(function() {
              // Put the data in the $scope
              $scope.legislation = legislation.articles;
              $rootScope.legislation = legislation.articles;
              $scope.legislationName = legislation.name;
              $rootScope.legislationName = legislation.name;

              // Add functions to the scope
              $scope.goToArticle = legislationController.goToArticle;

              helpers.successViewLoad();
            }, 500);
          }).catch(function(err) {
            helpers.error(err);
          });
      }
    };

    var articleController = {
      showView: function(legislationName, articleNumber) {
        $scope.isLoading = true;
        if ($rootScope.legislationName === legislationName) {
          $timeout(function() {
            // Put the data in the $scope
            $scope.legislationName = legislationName;
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
      $stateParams.pageTitle = null;
      appModel.loadInstanceData()
        .then(function() {
          var detail = $stateParams.detail.split('&');
          $scope.view = detail[0] === '' ? page.LIST : detail[0];

          // Decide where to go based on the $stateParams
          if ($scope.view === page.LIST) {
            listController.showView();
          } else if ($scope.view === page.CATEGORY) {
            $stateParams.pageTitle = detail[1];
            /** PRODUCT PAGE **/
            listController.showView(detail[1]);
          } else if ($scope.view === page.LEGISLATION) {
            $stateParams.pageTitle = detail[1];
            /** PRODUCT PAGE **/
            legislationController.showView(detail[1]);
          } else if ($scope.view === page.ARTICLE) {
            $stateParams.pageTitle = detail[1] + ' - Art. ' + detail[2];
            /** CATEGORY PAGE **/
            articleController.showView(detail[1], detail[2]);
          }

          // Make the general functions avalable in the scope
          $scope.listHeight = helpers.listHeight();
          $scope.goToLegislation = helpers.goToLegislation;
          $scope.goToCategoryOrLegislation = helpers.goToCategoryOrLegislation;
          $scope.goToArticle = helpers.goToArticle;
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
