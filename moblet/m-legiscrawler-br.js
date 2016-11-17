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
    $http,
    $q
  ) {
    var model = {
      dataLoadOptions: {
        cache: ($stateParams.detail !== "")
      },
      getData: function(url) {
        var deferred = $q.defer();
        var baseUrl = "https://legiscrawler.com.br:4433/v1/";
        $http.get(baseUrl + (url || ''))
          .then(
            function(response) {
              deferred.resolve(response);
            },
            function(error) {
              console.error(error);
              deferred.reject(error);
            }
          );
        return deferred.promise;
      }
    };
    var mainViewController = {
       /**
       * Show the moblet main view
       * @param {Array} list The list of legislations
       */
      setMainView: function(list) {
        $scope.isLoading = false;
        $scope.error = false;
        $scope.isDetail = false;

        if (list.length > 0) {
          $scope.list = list;

					// Broadcast complete refresh and infinite scroll
          $rootScope.$broadcast('scroll.refreshComplete');
          $rootScope.$broadcast('scroll.infiniteScrollComplete');
        } else {
          $scope.noContent = true;
        }
      }
    };
    // var dataLoadOptions;
    // var apiUrl = '';
    var controller = {
      /**
       * Check if the view is showing a detail or the list. The function checks
       * if $stateParams.detail is set.
       * @return {boolean} True if the view must show a detail.
       */
      // isDetail: function() {
      //   return $stateParams.detail !== "";
      // },
      /**
       * Show the detail getting the index from $stateParams.detail. Set "item"
       * to the selected detail
       */
      // showDetail: function(detailIndex) {
      //   if (isDefined($stateParams.detail) && $stateParams.detail !== "") {
      //     var itemIndex = _.findIndex($scope.items, function(item) {
      //       return item.id.toString() === $stateParams.detail;
      //     });
      //     if (itemIndex === -1) {
      //       dataLoadOptions = {
      //         offset: $scope.items === undefined ? 0 : $scope.items.length,
      //         items: 25,
      //         cache: false
      //       };
      //       list.load(false, function() {
      //         list.showDetail();
      //       });
      //     } else {
      //       $scope.detail = $scope.items[itemIndex];
      //     }
      //   } else if (isDefined(detailIndex)) {
      //     $scope.detail = $scope.items[detailIndex];
      //   }
      // },
      /**
       * Get the legislations list
       * @return {Promise} Promise that may contain the list of legislations
       */
      getLegislationList: function() {
        var deferred = $q.defer();
        model.getData()
            .then(function(response) {
              console.debug(response.data);
              deferred.resolve(response.data);
            })
            .catch(function(error) {
              console.error(error);
              deferred.reject(error);
            });
        return deferred.promise;
      },

      init: function() {
        $scope.isLoading = true;
        controller.getLegislationList()
          .then(function(list) {
            mainViewController.setMainView(list);
          })
          .catch(function(error) {
            console.error(error);
            $scope.isLoading = false;
            $scope.error = true;
          });
      }
    };
    controller.init();
  }
};
