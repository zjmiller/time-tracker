import d3 from 'd3';
import $ from 'jquery';

class ActivityToken {
  constructor(type, startTime, endTime = null){
    this.activityID = 'id' + Date.now();
    this.type = type;
    this.startTime = startTime;
    this.endTime = endTime;
  }

  end(){
    this.endTime = new Date();
  }

  changeType(newType){
    this.type = newType;
  }

  isOngoing(){
    return this.endTime === null;
  }

  getDuration(){
    if (this.isOngoing()) return Date.now() - this.startTime.getTime();
    return this.endTime.getTime() - this.startTime.getTime();
  }
}

class TimeTracker {
  constructor(){
    this.activities = [];
  }

  addActivityToken(type){
    this.activities.push(new ActivityToken(type, new Date()));
  }

  areOnSameDay(d1, d2){
    return d1.toDateString() === d2.toDateString();
  }

  extractDay(date){
    return new Date(date.toDateString());
  }

  getNextDay(date){
    return new Date(date.getTime() + (3600 * 1000 * 24));
  }

  getTimeEngagedInCertainActivityType(type, activities = this.activities){
    return (
      activities
        .filter(activity => activity.type === type)
        .reduce((total, activity) => total + activity.getDuration(), 0)
    );
  }

  getListOfActivityTypes(activities = this.activities){
    const activityTypes = [];

    activities.forEach(activity => {
      const alreadyIncluded = activityTypes.find(activityType => activity.type === activityType);
      if (!alreadyIncluded) activityTypes.push(activity.type);
    });

    return activityTypes;
  }

  genColorCodeMap(activities = this.activities){
    const activityTypes = this.getListOfActivityTypes(activities);
    return function(type){
      if (type === activityTypes[0]) return '#d65454';
      if (type === activityTypes[1]) return '#4a8fd3';
      if (type === activityTypes[2]) return '#8ecc64';
      if (type === activityTypes[3]) return '#e7ba52';
      if (type === activityTypes[4]) return '#3ca0a0';
      if (type === activityTypes[5]) return '#8a497e';
    }
  }

  getTimeEngagedInEachActivityType(activities = this.activities){
    const activityTypes = this.getListOfActivityTypes(activities);

    const activityTypesWithTimeEngaged = activityTypes.map(activityType => {
      return {
        type: activityType,
        timeEngagedInThisActivityType: this.getTimeEngagedInCertainActivityType(activityType, activities),
        timeEngagedInAllActivityTypes: this.getTotalTimeEngaged(activities)
      };
    });

    return activityTypesWithTimeEngaged;
  }

  getTotalTimeEngaged(activities = this.activities){
    const totalTimeEngaged = activities.reduce((total, curVal) => total + curVal.getDuration(), 0);
    return totalTimeEngaged;
  }

  groupActivitiesByDay(){
    const activitiesByDay = [];

    let currentDay = this.extractDay(this.activities[0].startTime);
    activitiesByDay.push({
      day: currentDay,
      activities: [],
      getTimeEngagedInCertainActivityType: this.getTimeEngagedInCertainActivityType,
      getTimeEngagedInEachActivityType: this.getTimeEngagedInEachActivityType,
      getTotalTimeEngaged: this.getTotalTimeEngaged,
      getListOfActivityTypes: this.getListOfActivityTypes
    });

    this.activities.forEach(activity => {
      while (!this.areOnSameDay(currentDay, activity.startTime)) {
        currentDay = this.getNextDay(currentDay);
        activitiesByDay.push({
          day: currentDay,
          activities: [],
          getTimeEngagedInCertainActivityType: this.getTimeEngagedInCertainActivityType,
          getTimeEngagedInEachActivityType: this.getTimeEngagedInEachActivityType,
          getTotalTimeEngaged: this.getTotalTimeEngaged,
          getListOfActivityTypes: this.getListOfActivityTypes
        });
      }

      activitiesByDay[activitiesByDay.length - 1].activities.push(activity);
    });

    return activitiesByDay;
  }
}

const a1 = new ActivityToken('reading', new Date('23 April 2016 13:15:00'), new Date('23 April 2016 14:15:00'));
const a1b = new ActivityToken('sleeping', new Date('23 April 2016 15:15:00'), new Date('23 April 2016 17:15:00'));
const a2 = new ActivityToken('reading', new Date('24 April 2016 13:35:00'), new Date('24 April 2016 14:15:00'));
const a3 = new ActivityToken('writing', new Date('24 April 2016 19:35:00'), new Date('24 April 2016 21:22:00'));
const a4 = new ActivityToken('reading', new Date('25 April 2016 09:35:00'), new Date('25 April 2016 11:22:00'));
const a5 = new ActivityToken('writing', new Date('25 April 2016 19:35:00'), new Date('25 April 2016 21:22:00'));
const a6 = new ActivityToken('writing', new Date('25 April 2016 22:35:00'), new Date('25 April 2016 22:42:00'));
const a7 = new ActivityToken('programming', new Date('25 April 2016 23:00:00'), new Date('25 April 2016 23:59:00'));
const a8 = new ActivityToken('reading', new Date('26 April 2016 13:15:00'), new Date('26 April 2016 14:15:00'));
const a9 = new ActivityToken('sleeping', new Date('26 April 2016 15:15:00'), new Date('26 April 2016 20:15:00'));
const a9a = new ActivityToken('eating', new Date('27 April 2016 15:15:00'), new Date('27 April 2016 20:15:00'));
const a9b = new ActivityToken('sleeping', new Date('28 April 2016 15:15:00'), new Date('28 April 2016 20:15:00'));
const a9c = new ActivityToken('programming', new Date('29 April 2016 05:15:00'), new Date('29 April 2016 20:15:00'));


const t = new TimeTracker;
t.activities.push(a1, a1b, a2, a3, a4, a5, a6, a7, a8, a9, a9a, a9b, a9c);

// Visualization code below

let windowWidth = $(window).width();
windowWidth -= 100;

let dayBoxWidth = (windowWidth / 7) - 60;
let dayBoxHeight = (windowWidth / 7) - 60;
let dayBoxRadius = Math.min(dayBoxWidth, dayBoxHeight) / 2;

d3.select('.app-container').style('width', ((dayBoxWidth + 60) * 7) + 'px')

// resize app on window resize
// not attaching anything heavy-duty to resize event
// because of reasons outlined http://ejohn.org/blog/learning-from-twitter/

let didResize = false;

$(window).resize(function() {
  didResize = true;
});

setInterval(function() {
  if (didResize) {
    didResize = false;
    windowWidth = $(window).width();
    if (windowWidth > 900) windowWidth -= 100;
    dayBoxWidth = (windowWidth / 7) - 60;
    dayBoxHeight = (windowWidth / 7) - 60;
    dayBoxRadius = Math.min(dayBoxWidth, dayBoxHeight) / 2;

    d3.select('.app-container').style('width', ((dayBoxWidth + 60) * 7) + 'px');

    render();
  }
}, 250);

function render(){

  // clear app container... all render is rerender
  d3.select('.app-container').html('');

  const dayDivs = d3.select('.app-container')
    .selectAll('div.day')
    .data(t.groupActivitiesByDay())
    .enter()
    .append('div')
    .classed('day', true)
    .style({
      width: dayBoxWidth - 1 + 'px',
      height: dayBoxHeight + 'px'
    });

  dayDivs.append('svg')
    .classed('svg-day', true)
    .attr({
      width: dayBoxWidth - 1,
      height: dayBoxHeight
    });

  dayDivs.append('div')
    .style('font', '500 16px Avenir')
    .style('text-align', 'center')
    .html(d => `${dateMonthToAbbr(d.day.getMonth())} ${d.day.getDate()}`);

  let cachedAngle = 0;

  d3.selectAll('svg.svg-day')
    .selectAll('g.activity')
    .data(d => d.getTimeEngagedInEachActivityType())
    .enter()
    .append('g')
    .attr('transform', `translate(${dayBoxWidth / 2}, ${dayBoxHeight / 2})`)
    .append('path')
    .classed('activity-path', true)
    .attr('d', (d, i) => {
      const arc = d3.svg.arc();
      arc.outerRadius(dayBoxRadius * Math.sqrt(d.timeEngagedInAllActivityTypes / (1000 * 3600 * 24)));
      arc.innerRadius(0);
      arc.startAngle(cachedAngle);
      const endAngle = cachedAngle + (d.timeEngagedInThisActivityType / d.timeEngagedInAllActivityTypes) * 2 * Math.PI;
      arc.endAngle(endAngle);
      cachedAngle = endAngle % (Math.PI * 2);
      return arc(d, i);
    })
    .attr('fill', (d, i) => t.genColorCodeMap()(d.type))
    .attr('stroke', '#333')
    .attr('stroke-width', 2);
}

render();

// Helper functions below
function dateMonthToAbbr(n){
  switch (n) {
    case 0:
      return 'Jan';
    case 1:
      return 'Feb';
    case 2:
      return 'Mar';
    case 3:
      return 'Apr';
    case 4:
      return 'May';
    case 5:
      return 'Jun';
    case 6:
      return 'Jul';
    case 7:
      return 'Aug';
    case 8:
      return 'Sep';
    case 9:
      return 'Oct';
    case 10:
      return 'Nov';
    case 11:
      return 'Dec';
    default:
      break;
  }
}
