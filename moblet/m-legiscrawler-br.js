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
    $ionicModal,
    $ionicScrollDelegate,
    $ionicHistory,
    $mAuth,
    $mContextualActions,
    $mDataLoader,
    $mFrameSize,
    $http,
    $q
  ) {
    var baseUrl = "http://api.legiscrawler.com.br/v1/";

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

              helpers.successViewLoad();
            }, 500);
          }).catch(function(err) {
          helpers.error(err);
        });
      }
    };

    var form = {
      post: function() {
        var postUrl = $scope.moblet.type.proxy + "post?";
        var auth = $mAuth.user.get().user;
        var postData = {
          code: $scope.moblet.instance.id,
          user: auth.name,
          email: auth.email,
          content: $scope.comment.description,
          image: $scope.comment.image
        };
        console.log(postData);
      // $http.get(postUrl + postData)
      //   .success(function() {
      //     $scope.modal.hide();
      //     $mLoading.hide();
      //     $scope.uWallMessage.title = auth.name;
      //     $scope.uWallMessage.isNew = true;
      //     if ($scope.items.length === 1) {
      //       if (typeof $scope.items[0].item.title !== "undefined") {
      //         $scope.items = [];
      //       }
      //     }
      //     $ionicScrollDelegate.scrollTop();
      //     $scope.items.unshift({
      //       item: angular.copy($scope.uWallMessage)
      //     });
      //     $scope.uWallMessage.description = "";
      //   }).error(function() {
      //   $mLoading.hide();
      //   $mAlert.toast($filter('translate')("send_error_msg"));
      // });
      }
    };

    var modal = {
      create: function() {
        $rootScope.$on('openModalWall', function() {
          $scope.modal.show();
        });
        $rootScope.$on('closeModalWall', function() {
          $scope.modal.hide();
        });
        $scope.closeModal = modal.close;
        $scope.comment = {
          description: "",
          image: ""
        };
        $ionicModal.fromTemplateUrl('my-modal.html', {
          scope: $scope,
          animation: 'slide-in-up',
          backdropClickToClose: false,
          hardwareBackButtonClose: true,
          focusFirstInput: true
        })
          .then(function(modal) {
            $scope.modal = modal;
          });;
      },
      close: function() {
        $scope.modal.hide();
      },
      submit: function() {
        form.post();
      },
      open: function() {
        $mAuth.user.isLogged(function(logged) {
          if (logged) {
            $scope.modal.show();
          } else {
            $mAuth.setCallback(function() {
              $mAuth.user.isLogged(function(isLogged) {
                if (isLogged) {
                  $timeout(function() {
                    $ionicHistory.goBack();
                    try {
                      document.querySelector('textarea').style.textIndent = 0;
                    } catch (r) {}
                    $timeout(function() {
                      $rootScope.$broadcast("openModalWall");
                      $ionicLoading.hide();
                    }, 500);
                  }, 500);
                } else {
                  $timeout(function() {
                    $ionicHistory.goBack();
                    $timeout(function() {
                      $rootScope.$broadcast("closeModalWall");
                      $ionicLoading.hide();
                    }, 500);
                  }, 500);
                }
              });
            });
            $mAuth.login();
          }
        });
      }
    };

    var articleController = {
      addContextualActions: function() {
        modal.create();
        $scope.submit = modal.submit;
        var actions = ["ion-ios-compose-outline", "ion-android-create"];
        $mContextualActions.add(
          $scope.page.page_id,
          "comment",
          actions,
          "float",
          modal.open
        );
      },
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

            // Add the comment contextual action
            articleController.addContextualActions();

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
