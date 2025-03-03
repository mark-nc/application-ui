/** *****************************************************************************
 * Licensed Materials - Property of IBM
 * (c) Copyright IBM Corporation 2018, 2019. All Rights Reserved.
 *
 * Note to U.S. Government Users Restricted Rights:
 * Use, duplication or disclosure restricted by GSA ADP Schedule
 * Contract with IBM Corp.
 ****************************************************************************** */
// Copyright (c) 2020 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project
'use strict'

import R from 'ramda'
import _ from 'lodash'
import {
  getNodePropery,
  addPropertyToList,
  createDeployableYamlLink,
  setResourceDeployStatus,
  setPodDeployStatus,
  setSubscriptionDeployStatus,
  setApplicationDeployStatus,
  setPlacementRuleDeployStatus,
  addDetails,
  addNodeOCPRouteLocationForCluster,
  addIngressNodeInfo,
  setClusterStatus
} from '../../utils/diagram-helpers'
import { showArgoApplicationSetLink } from '../../utils/diagram-helpers-argo'
import msgs from '../../../../../nls/platform.properties'
import { kubeNaming } from './titles'

const resName = 'resource.name'

export const getNodeDetails = (node, updatedNode, activeFilters) => {
  const details = []
  if (node) {
    const { type, specs, labels = [] } = node

    // for argo apps with application sets
    showArgoApplicationSetLink(node, details)

    //if resource has a row number add deployable yaml
    createDeployableYamlLink(node, details)

    details.push({
      type: 'spacer'
    })
    if (type !== 'cluster') {
      details.push({
        type: 'label',
        labelKey: 'prop.details.section'
      })
    } else {
      details.push({
        type: 'label',
        labelKey: 'prop.details.section.cluster'
      })
    }
    details.push({
      type: 'spacer'
    })

    switch (type) {
    case 'cluster':
      setClusterStatus(node, details)
      break

    case 'placement':
      {
        const { placements = [] } = specs
        details.push({
          type: 'label',
          labelKey: 'resource.placement'
        })
        placements.forEach(placement => {
          details.push({
            type: 'snippet',
            value: placement
          })
        })
      }
      break

    case 'package':
      addDetails(details, [
        {
          labelKey: resName,
          value: _.get(node, 'specs.raw.metadata.name', '')
        },
        {
          labelKey: 'resource.message',
          value: msgs.get('resource.helm.nodata.message')
        }
      ])
      break

    default:
      addK8Details(node, updatedNode, details, activeFilters)
      break
    }

    // labels
    if (labels && labels.length) {
      details.push({
        type: 'label',
        labelKey: 'resource.labels'
      })
      labels.forEach(({ name: lname, value: lvalue }) => {
        const labelDetails = [{ value: `${lname} = ${lvalue}`, indent: true }]
        addDetails(details, labelDetails)
      })
    }
  }
  return details
}

function addK8Details(node, updatedNode, details, activeFilters) {
  const { clusterName, type, layout = {}, specs } = node
  const { isDesign } = specs
  let labels
  const { type: ltype } = layout

  // not all resources have a namespace

  let namespace = ''
  if (node && R.pathOr('', ['specs', 'pulse'])(node) !== 'orange') {
    const kindModel = _.get(node, `specs.${type}Model`, {})
    let computedNSList = []
    _.flatten(Object.values(kindModel)).forEach(item => {
      computedNSList = R.union(computedNSList, [item.namespace])
    })

    computedNSList.forEach(item => {
      namespace = namespace.length === 0 ? item : `${namespace},${item}`
    })
  }

  const nodeAnnotations = _.get(node, 'specs.raw.metadata.annotations', {})
  const gitBranchAnnotation = nodeAnnotations[
    'apps.open-cluster-management.io/git-branch'
  ]
    ? 'apps.open-cluster-management.io/git-branch'
    : 'apps.open-cluster-management.io/github-branch'
  const gitPathAnnotation = nodeAnnotations[
    'apps.open-cluster-management.io/git-path'
  ]
    ? 'apps.open-cluster-management.io/git-path'
    : 'apps.open-cluster-management.io/github-path'
  const gitTagAnnotation = 'apps.open-cluster-management.io/git-tag'
  const gitCommitAnnotation =
    'apps.open-cluster-management.io/git-desired-commit'
  const reconcileRateAnnotation =
    'apps.open-cluster-management.io/reconcile-rate'

  const apiVersion = _.get(node, 'specs.raw.apiVersion', '')
  // the main stuff
  const mainDetails = [
    {
      labelKey: 'resource.type',
      value: kubeNaming(ltype) || kubeNaming(type)
    },
    {
      labelKey: 'resource.api.version',
      value: apiVersion ? apiVersion : undefined
    },
    {
      labelKey: 'resource.cluster',
      value: clusterName ? clusterName : undefined
    },
    {
      labelKey: 'resource.namespace',
      value: namespace
        ? namespace
        : R.pathOr('N/A', ['specs', 'raw', 'metadata', 'namespace'])(node)
    }
  ]

  //for charts
  addPropertyToList(
    mainDetails,
    getNodePropery(
      node,
      ['specs', 'raw', 'spec', 'chartName'],
      'raw.spec.chart.name'
    )
  )

  addPropertyToList(
    mainDetails,
    getNodePropery(
      node,
      ['specs', 'raw', 'spec', 'releaseName'],
      'raw.spec.release.name'
    )
  )
  addPropertyToList(
    mainDetails,
    getNodePropery(
      node,
      ['specs', 'raw', 'spec', 'version'],
      'raw.spec.version'
    )
  )

  //
  if (!isDesign && isDesign !== undefined) {
    const resourceModel = _.get(specs, `${type}Model`)
    if (resourceModel) {
      // get first item in the object as all should have the same labels
      const resourceLabels =
        Object.keys(resourceModel).length > 0
          ? resourceModel[Object.keys(resourceModel)[0]][0].label
          : undefined
      labels = resourceLabels ? resourceLabels.replace('; ', ',') : 'No labels'
    } else {
      labels = 'No labels'
    }

    addPropertyToList(mainDetails, {
      labelKey: 'raw.spec.metadata.label',
      value: labels
    })
  } else {
    addPropertyToList(
      mainDetails,
      getNodePropery(
        node,
        ['specs', 'raw', 'metadata', 'labels'],
        'raw.spec.metadata.label',
        'No labels'
      )
    )
  }

  addPropertyToList(
    mainDetails,
    getNodePropery(
      node,
      ['specs', 'raw', 'spec', 'replicas'],
      'raw.spec.replicas'
    )
  )

  addPropertyToList(
    mainDetails,
    getNodePropery(
      node,
      ['specs', 'raw', 'spec', 'selector', 'matchLabels'],
      'raw.spec.selector'
    )
  )

  if (!R.pathOr(['specs', 'raw', 'spec', 'selector', 'matchLabels'])) {
    addPropertyToList(
      mainDetails,
      getNodePropery(
        node,
        ['specs', 'raw', 'spec', 'selector'],
        'raw.spec.selector'
      )
    )
  }

  addPropertyToList(
    mainDetails,
    getNodePropery(node, ['specs', 'raw', 'spec', 'ports'], 'raw.spec.ports')
  )

  //subscription specific
  addPropertyToList(
    mainDetails,
    getNodePropery(
      node,
      ['specs', 'raw', 'spec', 'channel'],
      'raw.spec.channel'
    )
  )

  //subscription operator specific
  addPropertyToList(
    mainDetails,
    getNodePropery(
      node,
      ['specs', 'raw', 'spec', 'installPlanApproval'],
      'raw.spec.installPlanApproval'
    )
  )

  addPropertyToList(
    mainDetails,
    getNodePropery(node, ['specs', 'raw', 'spec', 'source'], 'raw.spec.source')
  )

  //argo cd app status
  addPropertyToList(
    mainDetails,
    getNodePropery(
      node,
      ['specs', 'raw', 'status', 'health', 'status'],
      'raw.status.health.status'
    )
  )

  addPropertyToList(
    mainDetails,
    getNodePropery(
      node,
      ['specs', 'raw', 'spec', 'sourceNamespace'],
      'raw.spec.sourceNamespace'
    )
  )

  addPropertyToList(
    mainDetails,
    getNodePropery(
      node,
      ['specs', 'raw', 'spec', 'startingCSV'],
      'raw.spec.startingCSV'
    )
  )
  ////

  addPropertyToList(
    mainDetails,
    getNodePropery(
      node,
      ['specs', 'raw', 'spec', 'packageFilter', 'filterRef'],
      'raw.spec.packageFilter'
    )
  )

  addPropertyToList(
    mainDetails,
    getNodePropery(
      node,
      ['specs', 'raw', 'spec', 'placement', 'placementRef'],
      'raw.spec.placementRef'
    )
  )

  addPropertyToList(
    mainDetails,
    getNodePropery(
      node,
      ['specs', 'raw', 'metadata', 'annotations', gitBranchAnnotation],
      'spec.subscr.annotations.gitBranch'
    )
  )

  addPropertyToList(
    mainDetails,
    getNodePropery(
      node,
      ['specs', 'raw', 'metadata', 'annotations', gitPathAnnotation],
      'spec.subscr.annotations.gitPath'
    )
  )

  if (nodeAnnotations[gitTagAnnotation]) {
    addPropertyToList(
      mainDetails,
      getNodePropery(
        node,
        ['specs', 'raw', 'metadata', 'annotations', gitTagAnnotation],
        'spec.subscr.annotations.gitTag'
      )
    )
  }

  if (nodeAnnotations[gitCommitAnnotation]) {
    addPropertyToList(
      mainDetails,
      getNodePropery(
        node,
        ['specs', 'raw', 'metadata', 'annotations', gitCommitAnnotation],
        'spec.subscr.annotations.gitCommit'
      )
    )
  }

  if (nodeAnnotations[reconcileRateAnnotation]) {
    addPropertyToList(
      mainDetails,
      getNodePropery(
        node,
        ['specs', 'raw', 'metadata', 'annotations', reconcileRateAnnotation],
        'spec.subscr.annotations.reconcileRate'
      )
    )
  }

  //PR specific
  addPropertyToList(
    mainDetails,
    getNodePropery(
      node,
      ['specs', 'raw', 'spec', 'clusterSelector', 'matchLabels'],
      'raw.spec.clusterSelector'
    )
  )

  addPropertyToList(
    mainDetails,
    getNodePropery(
      node,
      ['specs', 'raw', 'spec', 'clusterConditions'],
      'raw.spec.clusterConditions'
    )
  )
  addPropertyToList(
    mainDetails,
    getNodePropery(
      node,
      ['specs', 'raw', 'spec', 'clusterLabels', 'matchLabels'],
      'raw.spec.clusterLabels'
    )
  )

  addPropertyToList(
    mainDetails,
    getNodePropery(
      node,
      ['specs', 'raw', 'spec', 'clusterReplicas'],
      'raw.spec.clusterReplicas'
    )
  )

  if (type === 'placements') {
    const specNbOfClustersTarget = R.pathOr(
      [],
      ['specs', 'raw', 'status', 'decisions']
    )(node)
    mainDetails.push({
      labelKey: 'raw.status.decisionCls',
      value: specNbOfClustersTarget.length
    })
  }

  //routes
  addPropertyToList(
    mainDetails,
    getNodePropery(node, ['specs', 'raw', 'spec', 'to'], 'raw.spec.to')
  )

  addPropertyToList(
    mainDetails,
    getNodePropery(node, ['specs', 'raw', 'spec', 'host'], 'raw.spec.host')
  )

  //persistent volume claim
  addPropertyToList(
    mainDetails,
    getNodePropery(
      node,
      ['specs', 'raw', 'spec', 'accessModes'],
      'raw.spec.accessmode'
    )
  )
  addDetails(details, mainDetails)

  details.push({
    type: 'spacer'
  })

  //if Route with host, show it here
  addNodeOCPRouteLocationForCluster(node, null, details)

  //add Ingress service info
  addIngressNodeInfo(node, details)

  setApplicationDeployStatus(node, details)
  //subscriptions status
  setSubscriptionDeployStatus(node, details, activeFilters)
  //placement rule details
  setPlacementRuleDeployStatus(node, details)

  //show error if the resource doesn't produce pods and was not deployed on remote clusters
  setResourceDeployStatus(node, details, activeFilters)

  // kube model details
  setPodDeployStatus(node, updatedNode, details, activeFilters)

  return details
}
