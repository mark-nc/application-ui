/*******************************************************************************
 * Licensed Materials - Property of IBM
 * (c) Copyright IBM Corporation 2017, 2019. All Rights Reserved.
 *
 * Note to U.S. Government Users Restricted Rights:
 * Use, duplication or disclosure restricted by GSA ADP Schedule
 * Contract with IBM Corp.
 *******************************************************************************/

import React from 'react';
import Masonry from 'react-masonry-component';
import msgs from '../../../../nls/platform.properties';
import { withLocale } from '../../../providers/LocaleProvider';
import resources from '../../../../lib/shared/resources';
import StackedChartCardModule from './components/StackedChartCardModule';
import LineChartCardModule from './components/LineChartCardModule';

import {
  masonryOptions,
  getChannelChartData,
  getChannelChartWidth,
  getDeployablesChartData,
} from './utils';

resources(() => {
  require('./style.scss');
});

const ApplicationDeploymentSummary = withLocale(({ HCMChannelList, HCMApplicationList, locale }) => {
  const channelChartData = getChannelChartData(HCMChannelList);
  const deployablesChartData = getDeployablesChartData(HCMApplicationList);
  const chartWidth = getChannelChartWidth(HCMChannelList);
  return (
    <div id="ApplicationDeploymentSummary">
      <div className="masonry-container">
        <Masonry
          enableResizableChildren
          disableImagesLoaded
          className="masonry-class"
          style={masonryOptions}
        >
          <div className="grid-item">
            <div className="grid-view">
              <div className="title">
                {msgs.get('recent.deployments.chart.title', locale)}
              </div>
              <LineChartCardModule
                data={deployablesChartData}
                locale={locale}
              />
            </div>
          </div>

          <div className="grid-item">
            <div className="grid-view">
              <div className="title">
                {msgs.get('channel.deployments.chart.title', locale)}
              </div>
              <StackedChartCardModule
                data={channelChartData}
                locale={locale}
                chartWidth={chartWidth}
              />
            </div>
          </div>
        </Masonry>
      </div>
    </div>
  );
});

export default withLocale(ApplicationDeploymentSummary);
