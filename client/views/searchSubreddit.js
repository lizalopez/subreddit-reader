import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { Session } from 'meteor/session';

import { 
  sortByCategory, 
  updateAllSearchPosts,
  paginate,
  fetchBySort,
  updateNewTopicSearch,
  deleteRemovedSubredditFromData,
} from '../utils.js';

Template.searchSubreddit.helpers({
  searchResults() {
    return Template.instance().searchResults.get();
  },
  searchedTopics() {
      return Session.get("searchedTopics");;
  },
  allSearchItems() {
    var unsortedItems = Template.instance().allSearchItems.get();
    var currentSortCategory = Template.instance().currentSort.get();
    var sortedByCategory;
    if (unsortedItems.length > 0) {
      sortedByCategory = sortByCategory(currentSortCategory, unsortedItems);
      return sortedByCategory;
    }
    return Template.instance().allSearchItems.get();
  },
});

Template.searchSubreddit.events({
  'submit .js-search-topic'(event, instance) {
    event.preventDefault();

    $('.js-search-topic').validate(
      {required: true}
    );

    var topic = event.target.text.value; 
    updateNewTopicSearch(topic, instance);
    event.target.reset();
  },
  'click .nav-pills li' (event, instance) {
    event.preventDefault();

    var currentSort = $(event.target).closest('li');
    currentSort.addClass('active');
    $('.nav-pills li').not(currentSort).removeClass('active');
    instance.currentSort.set(currentSort.data('template'));

    var filter = instance.currentSort.get();
    fetchBySort(instance, filter)
  },
  'click .js-reset-scroll' (event, instance) {
    event.preventDefault();
    $('body').scrollTop(0);
    $('body').css("min-height", 0);
  },
});

Template.searchSubreddit.onCreated(function() {
  var instance = this;
    // counter starts at 0
  instance.searchResults = new ReactiveVar();
  instance.allSearchItems = new ReactiveVar();
  instance.currentSort = new ReactiveVar('hot');
  instance.pagination = new ReactiveVar(0);

  $(window).scroll(function(){
    if ($(window).scrollTop() == $(document).height()-$(window).height()){
        var currentPosts = instance.searchResults.get();
          if (currentPosts.length > 0) {
            paginate(instance, currentPosts);
          }
    }
  });

  Session.set("searchedTopics", []);

  instance.autorun(function() {
      var reactiveSearchTopics = Session.get('searchedTopics');
      if (reactiveSearchTopics.length > 0) {
        deleteRemovedSubredditFromData(instance, reactiveSearchTopics);
        var updatedPosts = updateAllSearchPosts(instance.searchResults.get());
        instance.allSearchItems.set(updatedPosts);
      } else {
        instance.searchResults.set([]);
        instance.allSearchItems.set([]);
      }
  })
});           

