# Webtask.io calendar-places

This webtask takes information from Google Calendar events and place them in a
CartoDB database, using CartoDB API and Geolocation API.

wt-cli is needed to create this task. Install it with npm.

# How to create the task

1. Init `wt init`

2. If you don't have a Google Maps API key, create a Server key [here](https://developers.google.com/maps/documentation/geolocation/get-api-key).

3. Create a [CartoDB](https://cartodb.com/) map with the name 'calendar_places' and get the API key at `https://{account-name}.cartodb.com/your_apps`.

4. Create the task running the next command

`wt create --secret CARTODB_API_KEY={cartodb-api-key} --secret GMAPS_API_KEY={google-maps-api-key} --secret CARTODB_ACCOUNT={account-name} calendar-places.js`

5. Create a [IFTTT](https://ifttt.com/myrecipes/personal) recipe taking "Google Calendar" channel with "any new event added" trigger.
And select Maker channel as Action.

6. At the Maker channel fill the URL with the next kind of URL: `https://webtask.it.auth0.com/api/run/{your-container}/calendar-places?webtask_no_cache=1&title=<<<{{Title}}>>>&where=<<<{{Where}}>>>&starts=<<<{{Starts}}>>>&ends=<<<{{Ends}}>>>`

This way, each time we add a new event to the calendar andthe event has the where field well formatted, the event will be added to the 'calendar_places' map.
