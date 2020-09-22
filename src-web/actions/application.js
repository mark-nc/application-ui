// /*******************************************************************************
//  * Licensed Materials - Property of IBM
//  * (c) Copyright IBM Corporation 2019. All Rights Reserved.
//  *
//  * Note to U.S. Government Users Restricted Rights:
//  * Use, duplication or disclosure restricted by GSA ADP Schedule
//  * Contract with IBM Corp.
//  * Copyright (c) 2020 Red Hat, Inc.
//  *******************************************************************************/

import apolloClient from '../../lib/client/apollo-client'
import {
  APPLICATION_CREATE_CLEAR_STATUS,
  APPLICATION_CREATE_IN_PROGRESS,
  APPLICATION_CREATE_SUCCESS,
  APPLICATION_CREATE_FAILURE,
  REQUEST_STATUS
} from './index'
import _ from 'lodash'

export const clearCreateStatus = () => ({
  type: APPLICATION_CREATE_CLEAR_STATUS
})

export const createApplicationInProgress = resourceName => ({
  type: APPLICATION_CREATE_IN_PROGRESS,
  resourceName
})

export const createApplicationSuccess = resourceName => ({
  type: APPLICATION_CREATE_SUCCESS,
  resourceName
})

export const createApplicationFailure = errors => ({
  type: APPLICATION_CREATE_FAILURE,
  postStatus: REQUEST_STATUS.ERROR,
  errors
})

export const createApplication = resourceJson => {
  return dispatch => {
    dispatch(createApplicationInProgress())
    return apolloClient.createApplication(resourceJson).then(result => {
      const errors = _.get(result, 'data.createApplication.errors')
      if (errors && errors.length > 0) {
        dispatch(createApplicationFailure(errors))
      } else {
        dispatch(createApplicationSuccess())
      }
      return result
    })
  }
}

export const updateApplication = resourceJson => {
  return dispatch => {
    dispatch(createApplicationInProgress())
    return apolloClient.updateApplication(resourceJson).then(result => {
      const errors = _.get(result, 'data.updateApplication.errors')
      if (errors && errors.length > 0) {
        dispatch(createApplicationFailure(errors))
      } else {
        dispatch(createApplicationSuccess())
      }
      return result
    })
  }
}
