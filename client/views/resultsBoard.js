import { Template } from 'meteor/templating';


Template.resultsBoard.helpers({
  formatDate(unixStamp) {
    return Chronos.moment(unixStamp*1000).fromNow();
  },
});

Template.resultsBoard.events({
  'click .nav-pills li' (event, instance) {
    event.preventDefault();

    var currentTab = $(event.target).closest('li');
    currentTab.addClass('active');
    $('.nav-pills li').not(currentTab).removeClass('active');
  },
});
