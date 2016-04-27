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

class ActivityList {
  constructor() {
    this.activities = [];
  }

  getListOfActivityTypes(activities = this.activities){
    const activityTypes = [];

    activities.forEach(activity => {
      const alreadyIncluded = activityTypes.find(activityType => activity.type === activityType);
      if (!alreadyIncluded) activityTypes.push(activity.type);
    });

    return activityTypes;
  }

  getTotalTimeEngaged(activities = this.activities){
    const totalTimeEngaged = activities.reduce((total, curVal) => total + curVal.getDuration(), 0);
    return totalTimeEngaged;
  }

  getTimeEngagedInCertainActivityType(type, activities = this.activities){
    return (
      activities
        .filter(activity => activity.type === type)
        .reduce((total, activity) => total + activity.getDuration(), 0)
    );
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

  isCurrentlyEngagedInActivityOfType(type){
    return undefined !== t.activities.find(activity => {
      return activity.type === type  && activity.endTime === null;
    });
  }

  getCurrentlyEngagedActivityOfType(type){
    return t.activities.find(activity => {
      return activity.type === type  && activity.endTime === null;
    });
  }
}

class DayActivityList extends ActivityList {
  constructor(day){
    super();
    this.day = day;
  }
}

class TimeTracker extends ActivityList {
  constructor(){
    super();
    this.activityTypes = ['reading', 'programming', 'writing', 'chess'];
  }

  genColorCodeMap(activities = this.activities){
    return type => {
      if (type === this.activityTypes[0]) return '#d65454';
      if (type === this.activityTypes[1]) return '#4a8fd3';
      if (type === this.activityTypes[2]) return '#8ecc64';
      if (type === this.activityTypes[3]) return '#e7ba52';
      if (type === this.activityTypes[4]) return '#3ca0a0';
      if (type === this.activityTypes[5]) return '#8a497e';
    }
  }

  addActivityToken(type){
    this.activities.push(new ActivityToken(type, new Date()));
  }

  stopEngagingInActivityOfType(type){
    this.getCurrentlyEngagedActivityOfType(type).end();
  }

  groupActivitiesByDay(){
    const activitiesByDay = [];

    let currentDay = this.extractDay(this.activities[0].startTime);
    activitiesByDay.push(new DayActivityList(currentDay));

    this.activities.forEach(activity => {
      while (!this.areOnSameDay(currentDay, activity.startTime)) {
        currentDay = this.getNextDay(currentDay);
        activitiesByDay.push(new DayActivityList(currentDay));
      }

      activitiesByDay[activitiesByDay.length - 1].activities.push(activity);
    });

    while (!this.areOnSameDay(currentDay, new Date()) && currentDay.getTime() <= Date.now()) {
      currentDay = this.getNextDay(currentDay);
      activitiesByDay.push(new DayActivityList(currentDay));
    }

    return activitiesByDay;
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

}

// seed data
const b3 = new ActivityToken('reading', new Date('17 April 2016 13:35:00'), new Date('17 April 2016 13:36:00'));
const b4 = new ActivityToken('programming', new Date('17 April 2016 19:35:00'), new Date('17 April 2016 19:37:00'));
const b5 = new ActivityToken('programming', new Date('18 April 2016 13:35:00'), new Date('18 April 2016 13:36:00'));
const b6 = new ActivityToken('writing', new Date('18 April 2016 19:35:00'), new Date('18 April 2016 19:37:00'));
const b7 = new ActivityToken('reading', new Date('19 April 2016 13:35:00'), new Date('19 April 2016 13:36:00'));
const b8 = new ActivityToken('writing', new Date('19 April 2016 19:35:00'), new Date('19 April 2016 19:37:00'));
const b9 = new ActivityToken('chess', new Date('20 April 2016 13:35:00'), new Date('20 April 2016 13:36:00'));
const b0 = new ActivityToken('programming', new Date('21 April 2016 19:35:00'), new Date('21 April 2016 19:37:00'));


const a1 = new ActivityToken('reading', new Date('22 April 2016 13:35:00'), new Date('22 April 2016 13:36:00'));
const a2 = new ActivityToken('writing', new Date('22 April 2016 19:35:00'), new Date('22 April 2016 19:37:00'));
const a3 = new ActivityToken('programming', new Date('23 April 2016 15:15:00'), new Date('23 April 2016 15:18:00'));
const a4 = new ActivityToken('reading', new Date('25 April 2016 09:35:00'), new Date('25 April 2016 09:36:00'));
const a5 = new ActivityToken('writing', new Date('25 April 2016 19:35:00'), new Date('25 April 2016 19:40:00'));
const a6 = new ActivityToken('chess', new Date('25 April 2016 22:35:00'), new Date('25 April 2016 22:37:00'));
const a7 = new ActivityToken('programming', new Date('25 April 2016 23:57:00'), new Date('25 April 2016 23:59:00'));
const a8 = new ActivityToken('reading', new Date('26 April 2016 13:15:00'), new Date('26 April 2016 13:15:30'));
const a9 = new ActivityToken('programming', new Date('26 April 2016 15:15:00'), new Date('26 April 2016 15:19:00'));

const t = new TimeTracker;
t.activities.push(b3, b4, b5, b6, b7, b8, b9, b0, a1, a2, a3, a4, a5, a6, a7, a8, a9);

// Visualization code below

let dayBoxMargin = 10;
let dayBoxHorizontalPadding = 10;
let dayBoxVerticalPadding = 30;

// set the follow 3 variables dynamically in appLayoutSetup
let dayBoxWidth;
let dayBoxHeight;
let dayBoxRadius;

function appLayoutSetup(){
  let windowWidth = Math.max($(window).width(), 920);
  windowWidth -= 100;

  dayBoxWidth = (windowWidth / 7) - dayBoxMargin;
  dayBoxHeight = (windowWidth / 7) - dayBoxMargin;
  dayBoxRadius = Math.min(dayBoxWidth, dayBoxHeight) / 2;

  d3.select('.app-container').style('width', (((dayBoxWidth + dayBoxMargin) * 7) + dayBoxMargin) + 'px')
}

appLayoutSetup();

// resize app on window resize
// not attaching anything heavy-duty to resize event
// because of reasons outlined http://ejohn.org/blog/learning-from-twitter/

let didResize = false;
let resizeRefreshRate = 250;

$(window).resize(function() {
  didResize = true;
});

setInterval(function() {
  if (didResize) {
    didResize = false;
    appLayoutSetup();
    render();
  }
}, resizeRefreshRate);

// also just refresh entire app periodically to reflect changes

let appRefreshRate = 5000;

setInterval(function() {
    render();
}, appRefreshRate);

function render(){

  // clear app container... all render is rerender
  d3.select('.app-container').html('');
  d3.select('.ui-controls-container').html('');

  const daysData = t.groupActivitiesByDay();

  const dayDivs = d3.select('.app-container')
    .selectAll('div.day')
    .data(daysData)
    .enter()
    .append('div')
    .classed('day', true)
    .style({
      width: dayBoxWidth + 'px',
      height: dayBoxHeight + 'px'
    })
    .style('margin-left', (d, i) => {
      if (i === 0) {
        return (((dayBoxWidth + dayBoxMargin) * d.day.getDay()) + dayBoxMargin) + 'px';
      } else {
        return dayBoxMargin + 'px';
      }
    })
    .style('margin-bottom', (dayBoxMargin - 5) + 'px')
    .style('padding', `${dayBoxVerticalPadding}px ${dayBoxHorizontalPadding}px`);

  dayDivs.append('svg')
    .classed('svg-day', true)
    .attr({
      width: dayBoxWidth - dayBoxHorizontalPadding * 2,
      height: dayBoxWidth - dayBoxVerticalPadding * 2
    });

  dayDivs.append('div')
    .style('font', '500 16px Avenir')
    .style('text-align', 'center')
    .style({
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: dayBoxVerticalPadding + 'px',
      'line-height': dayBoxVerticalPadding + 'px'
    })
    .html(d => `${dateMonthToAbbr(d.day.getMonth())} ${d.day.getDate()}`);

  let cachedAngle = 0;

  d3.selectAll('svg.svg-day')
    .selectAll('g.activity')
    .data(d => d.getTimeEngagedInEachActivityType())
    .enter()
    .append('g')
    .attr('transform', `translate(${(dayBoxWidth - dayBoxHorizontalPadding * 2) / 2}, ${(dayBoxHeight - dayBoxVerticalPadding * 2) / 2})`)
    .append('path')
    .classed('activity-path', true)
    .attr('d', (d, i) => {
      const arc = d3.svg.arc();
      const mostTimeSpentEngagedDuringSingleDay = Math.max(...daysData.map(day => t.getTotalTimeEngaged(day.activities)));
      arc.outerRadius((dayBoxRadius - Math.max(dayBoxHorizontalPadding, dayBoxVerticalPadding)) * Math.sqrt(d.timeEngagedInAllActivityTypes / (mostTimeSpentEngagedDuringSingleDay)) - 2);
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

    const buttonOuterDivs = d3.select('.ui-controls-container')
      .selectAll('div.activity-btn')
      .data(t.activityTypes)
      .enter()
      .append('div')
      .classed('activity-btn', true)
      .on('click', d => {
        if (!t.isCurrentlyEngagedInActivityOfType(d)) t.addActivityToken(d);
        else t.stopEngagingInActivityOfType(d)
        render();
      });

    buttonOuterDivs.append('div')
      .style('opacity', d => {
        return t.isCurrentlyEngagedInActivityOfType(d) ? 0.5 : 1;
      })
      .html(d => d)
      .style('background-color', d => t.genColorCodeMap()(d))
      .style('padding', '0 10px')

    buttonOuterDivs.append(d => {
        const el = document.createElement('div');
        el.classList.add('activity-btn-time-label');
        return el;
      })
      .html(d => {
        const activityTokenOfTypeIfCurrentlyEngagedIn = t.activities.find(activity => {
          return activity.type === d  && activity.endTime === null;
        });
        return activityTokenOfTypeIfCurrentlyEngagedIn ? formatMilliseconds(activityTokenOfTypeIfCurrentlyEngagedIn.getDuration()) : '';
      });
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

function formatMilliseconds(milliseconds){
  let str = '';
  const hours = Math.floor(milliseconds / (3600 * 1000));
  let remainingMilliseconds = milliseconds - (hours * 3600 * 1000);
  const minutes = Math.floor(remainingMilliseconds / (60 * 1000));
  remainingMilliseconds -= minutes * 60 * 1000;
  const seconds = Math.floor(remainingMilliseconds / 1000);

  return `${hours ? hours + 'h ' : ''}${minutes ? minutes + 'm ' : ''}${seconds}s`;
}

window.t = t;
