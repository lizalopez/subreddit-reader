import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';


Template.subredditsIncluded.events({

  'click .js-remove-search-item button'(event, instance) {
    event.preventDefault();

    const topicToRemove = this.valueOf();//.closest( "p" );

   // let topicList = Template.instance().searchedTopics.get();
   let topicList = Session.get("searchedTopics");
   topicList.splice(topicList.indexOf(topicToRemove), 1);
   Session.set("searchedTopics", topicList);
  },
});