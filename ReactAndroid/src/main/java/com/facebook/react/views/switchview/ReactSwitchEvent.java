/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.switchview;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.uimanager.events.Event;
import com.facebook.react.uimanager.events.RCTEventEmitter;

/**
 * Event emitted by a ReactSwitchManager once a switch is fully switched on/off
 */
/*package*/ class ReactSwitchEvent extends Event<ReactSwitchEvent> {

    public static final String EVENT_NAME = "topChange";

    private final boolean mIsChecked;

    public ReactSwitchEvent(int viewId, boolean isChecked) {
        super(viewId);
        mIsChecked = isChecked;
    }

    public boolean getIsChecked() {
        return mIsChecked;
    }

    @Override
    public String getEventName() {
        return EVENT_NAME;
    }

    @Override
    public short getCoalescingKey() {
        // All switch events for a given view can be coalesced.
        return 0;
    }

    @Override
    public void dispatch(RCTEventEmitter rctEventEmitter) {
        rctEventEmitter.receiveEvent(getViewTag(), getEventName(), serializeEventData());
    }

    private WritableMap serializeEventData() {
        WritableMap eventData = Arguments.createMap();
        eventData.putInt("target", getViewTag());
        eventData.putBoolean("value", getIsChecked());
        return eventData;
    }
}
