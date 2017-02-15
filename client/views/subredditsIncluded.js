import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';


Template.subredditsIncluded.events({

  'click .js-remove-search-item button'(event, instance) {
    event.preventDefault();

    var topicToRemove = this.valueOf();;

    var topicList = Session.get("searchedTopics");
    topicList.splice(topicList.indexOf(topicToRemove), 1);
    Session.set("searchedTopics", topicList);
  },
});