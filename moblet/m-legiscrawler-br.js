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
    $filter,
    $interval,
    $timeout,
    $state,
    $stateParams,
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
      error: function() {
        $scope.isLoading = false;
        $scope.error = true;
        $scope.noContent = true;
      },
      listHeight: function() {
        var height = parseInt($mFrameSize.height(), 10);
        return (height - 50) + "px";
      },
      removeAccents: function(value) {
        value = value
          .toLowerCase()
          .replace(
            /(\u0061[\u0300\u0301\u0302\u0303\u0304\u0305]|[áàâãä])/g,
            'a')
          .replace(
            /(\u0065[\u0300\u0301\u0302\u0303\u0304\u0305]|[éèêë])/g,
            'e')
          .replace(
            /(\u0069[\u0300\u0301\u0302\u0303\u0304\u0305]|[íìîï])/g,
            'i')
          .replace(
            /(\u006F[\u0300\u0301\u0302\u0303\u0304\u0305]|[óòôõö])/g,
            'o')
          .replace(
            /(\u0075[\u0300\u0301\u0302\u0303\u0304\u0305]|[úùûü])/g,
            'u')
          .replace(
            /(\u0063\u0327|ç)/g,
            'c');
        return value;
      },
      updateSearch: function(text) {
        $scope.searchText = text;
      },
      search: function(item) {
        if (!$scope.searchText) {
          return true;
        }

        var text = helpers.removeAccents(item);
        var search = helpers.removeAccents($scope.searchText);

        return text.indexOf(search) > -1;
      }
    };

    var appModel = {
      loadInstanceData: function() {
        var deferred = $q.defer();
        var dataLoadOptions = {
          cache: false
        };

        $mDataLoader.load($scope.moblet, dataLoadOptions)
          .then(function(data) {
            $scope.listStyle = data.listStyle;
            $scope.itemStyle = data.itemStyle;
            deferred.resolve();
          })
          .catch(function(error) {
            console.error(error);
            deferred.reject();
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
            function(error) {
              console.error(error);
              deferred.reject(error);
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
              // Set the view
              $scope.view = page.LIST;

              // Set error and emptData to false
              $scope.error = false;
              $scope.noContent = false;

              // Remove the loader
              $scope.isLoading = false;

              // Broadcast complete refresh and infinite scroll
              $rootScope.$broadcast('scroll.refreshComplete');
              $rootScope.$broadcast('scroll.infiniteScrollComplete');
            } else {
              helpers.error();
            }
          })
          .catch(function(err) {
            console.error(err);
            helpers.error();
          });
      }
    };

    var router = function() {
      console.debug('router()');
      // Set general status
      $scope.isLoading = true;
      // Make the needed helper functions avalable in the scope
      $scope.updateSearch = helpers.updateSearch;
      $scope.search = helpers.search;
      $scope.listHeight = helpers.listHeight;

      // Decide where to go based on the $stateParams
      if ($stateParams.detail === '') {
        console.debug('LIST');
        /** LIST PAGE **/
        appModel.loadInstanceData()
          .then(function() {
            listController.showView();
          })
          .catch(function() {
            helpers.error();
          });
      } else {
        var detail = $stateParams.detail.split('&');
        $scope.view = detail[0];
        $stateParams.detail = detail[1];
        if ($scope.view === page.LEGISLATION) {
          /** PRODUCT PAGE **/
          console.debug('LEGISLATION');
        } else if ($scope.view === page.ARTICLE) {
          /** CATEGORY PAGE **/
          console.debug('ARTICLE');
        }
      }
    };

    router();
  }
};
