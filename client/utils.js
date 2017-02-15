import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { HTTP } from 'meteor/http';
import { Session } from 'meteor/session';

// assign a color to each topic, so it's clearer to see which they belong to?


export function sortByCategory(category, items) {
  let sortedList;
  switch(category) {
    case 'hot':
    case 'controversial':
      sortedList = items.sort(function (a, b) {
        return a.rank - b.rank;
      });
      break;
    case 'new':
      sortedList = items.sort(function (a, b) {
        return moment.unix(b.created) - moment.unix(a.created)
      });
      break;
    case 'top':
      sortedList = items.sort(function (a, b) {
        return b.score - a.score;
      });
      break;
  }
  return sortedList;
}

          
export function updateAllSearchPosts(searchResults) {
  if (searchResults) {
    var updated =  _.reduce(searchResults, function(allPosts, topicObjects){
      let updated = allPosts.concat(topicObjects.posts)
      return updated;
    }, []);
    return updated;
  }
}




export function paginate(instance, pageIndex, currentResults) {
   let latestSearchResults;
   let existingSearchResults = instance.searchResults.get();

    for (var i = 0; i < currentResults.length; i++) {
      let subreddit = currentResults[i];
      let afterPage = subreddit.after;
      let topic = subreddit.topic;
      let pageIndex = subreddit.page;
    let filter =  instance.currentSort.get(); 

      fetchSubredditResults(topic, filter, pageIndex, afterPage).then(function(latestSearchResults) {
        let existingSearchResults = instance.searchResults.get();
        let correspondingPosts = _.findWhere(existingSearchResults, {topic: latestSearchResults.topic});
          correspondingPosts.posts = correspondingPosts.posts.concat(latestSearchResults.posts);
          correspondingPosts.after = latestSearchResults.after;
          correspondingPosts.page = latestSearchResults.page;
          let topicList = Session.get('searchedTopics');
          let index = topicList.indexOf(topic);
          existingSearchResults.splice(index, 1, correspondingPosts);
          instance.searchResults.set(existingSearchResults);
      }).catch(function(error) {console.log('Error fetching topic results:', error)});
    }
}

export function fetchBySort(instance) {
  let topicList = Session.get('searchedTopics');
  let existingSearchResults = instance.searchResults.get();
  let filter =  instance.currentSort.get(); 
  for (var i = 0; i < existingSearchResults.length; i++) {

    let existingSubredditItem = existingSearchResults[i];
    fetchSubredditResults(existingSubredditItem.topic, filter, null, null).then(function(latestSearchResults) {
      let correspondingPosts = _.findWhere(existingSearchResults, {topic: latestSearchResults.topic});
      correspondingPosts.posts = latestSearchResults.posts;
      correspondingPosts.after = latestSearchResults.after;
      correspondingPosts.page = latestSearchResults.page; 
      let index = topicList.indexOf(latestSearchResults.topic);
      existingSearchResults.splice(index, 1, correspondingPosts);
      instance.searchResults.set(existingSearchResults);

    }).catch(function(error) {console.log('Error fetching new filter for topic:', error)});
  }
}

export function updateNewTopicSearch(topic, instance) {
  //if topic in array
  let topicList = Session.get('searchedTopics');
  if (topicList.indexOf(topic) >= 0) {
    console.warn('Subreddit already in list');
    return;
  } else {
    let latestSearchResults;
    //if  pagination
    let pageIndex;
    let existingSearchResults = instance.searchResults.get();

    let filter =  instance.currentSort.get();
    fetchSubredditResults(topic, filter, null, null).then(function(latestSearchResults) {
      let existingSearchResults = instance.searchResults.get();
      if (existingSearchResults.length > 0) {
        let trimmedPosts = _.reduce(existingSearchResults, function(updatedSubredditResults, priorPosts) {
          let updatedPost = _.extend(priorPosts, {
            posts: priorPosts.posts.slice(0,9),
            page: null,
            after: null
          });
          updatedSubredditResults.push(updatedPost);
          return updatedSubredditResults
        }, []);
        trimmedPosts.push(latestSearchResults);
        instance.searchResults.set(trimmedPosts);
      } else {
        instance.searchResults.set([latestSearchResults]);
      }
      instance.pagination.set(latestSearchResults.page);
      topicList.push(topic);
      Session.set('searchedTopics', topicList);
    }).catch(function(error) {console.log('Error fetching topic results:', error)});
  }
}

function fetchSubredditResults(topic, filter, pageIndex, afterPage) {
  let page = pageIndex || 1;
  let query = 'https://www.reddit.com/r/'+topic+'/'+filter+'.json?limit=9';
  if (afterPage) {
  let count = pageIndex-1;
    query= query + '&after=' + afterPage + '&count='+ count;
  }
  return new Promise(function(resolve, reject) {
    //http://www.reddit.com/r/westworld.json?limit=15&after=t3_5sv5pq&count=20
    const searchResults = HTTP.call('GET', query, function(err, res) {
      if (err) {
      console.log('Error:', err);
      reject(err);
      } else {      
        let pageNum;      
        const results = _.map(res.data.data.children, function(item, index) {
        //TODO: filter only when there is valid thumbnail?
            let post = item.data;
            let pagePrefix ;
            return {
              id : post.id,
              title: post.title,
              url: "https://www.reddit.com"+post.permalink,
              score: post.score,
              thumbnail: post.thumbnail,
              author: post.author,
              created: post.created_utc,
              subreddit: topic,
              numComments: post.num_comments,
              rank: page + index,
            };
          });
          let afterPage = res.data.data.after;
          let lastPage = _.last(results).rank + 1;
        const updatedResults = {};
        updatedResults.topic = topic;
        updatedResults.posts = results;
        updatedResults.after = afterPage;
        updatedResults.page = lastPage;
        resolve(updatedResults);
      }
    });
  })
}

export function deleteRemovedSubredditFromData(instance, searchList) {
  //iterate over each resultList item / resultItem.topic, backwards
  let searchResults = instance.searchResults.get();
  for (var i = searchResults.length -1; i >= 0; i--) {
    let resultItem = searchResults[i];
    let matchFound = false;
    for (var j = 0; j< searchList.length && !matchFound; j++) {
      let searchTopic = searchList[j];
      if (resultItem.topic === searchTopic) {
        matchFound = true;
      }
    }
    if (!matchFound) {
      searchResults.splice(i, 1);
      instance.searchResults.set(searchResults);
    }
  }
}
