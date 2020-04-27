import React from 'react';
import { Formik, FormikHelpers, validateYupSchema, yupToFormErrors, FormikProps } from 'formik';
import { Link } from 'react-router-dom';
import {
  Form,
  PageSectionVariants,
  TextContent,
  Text,
  ButtonVariant,
  Grid,
  GridItem,
  Alert,
  AlertVariant,
  AlertActionCloseButton,
  TextInputTypes,
} from '@patternfly/react-core';
import { ExternalLinkAltIcon } from '@patternfly/react-icons';

import ClusterWizardToolbar from './ClusterWizardToolbar';
import PageSection from '../ui/PageSection';
import { ToolbarButton, ToolbarText } from '../ui/Toolbar';
import { InputField, TextAreaField, SelectField } from '../ui/formik';
import validationSchema from './validationSchema';
import GridGap from '../ui/GridGap';
import { Cluster, ClusterUpdateParams, Host } from '../../api/types';
import { WizardStep } from '../../types/wizard';
import { patchCluster } from '../../api/clusters';
import AlertsSection from '../ui/AlertsSection';

interface ClusterWizardFormProps {
  cluster: Cluster;
  setStep: React.Dispatch<React.SetStateAction<WizardStep>>;
}

const ClusterWizardForm: React.FC<ClusterWizardFormProps> = ({ cluster, setStep }) => {
  const initialValues: ClusterUpdateParams = {
    name: cluster.name || '',
    openshiftVersion: cluster.openshiftVersion || '4.4',
    baseDnsDomain: cluster.baseDnsDomain || '',
    clusterNetworkCIDR: cluster.clusterNetworkCIDR || '',
    clusterNetworkHostPrefix: cluster.clusterNetworkHostPrefix || 0,
    serviceNetworkCIDR: cluster.serviceNetworkCIDR || '',
    apiVip: cluster.apiVip || '',
    dnsVip: cluster.dnsVip || '',
    ingressVip: cluster.ingressVip || '',
    pullSecret: cluster.pullSecret || '',
    sshPublicKey: cluster.sshPublicKey || '',
    hostsRoles:
      cluster.hosts?.map((host: Host) => ({
        id: host.id,
        role: host.role as 'master' | 'worker',
      })) || [],
  };

  const validate = (values: ClusterUpdateParams) => {
    // NOTE(jtomasek): This allows passing context to Yup schema
    // https://github.com/jaredpalmer/formik/issues/506#issuecomment-372229014
    try {
      validateYupSchema<ClusterUpdateParams>(values, validationSchema, true);
    } catch (err) {
      return yupToFormErrors(err);
    }
    return {};
  };

  const handleSubmit = async (
    values: ClusterUpdateParams,
    formikActions: FormikHelpers<ClusterUpdateParams>,
  ) => {
    try {
      const { data } = await patchCluster(cluster.id, values); // eslint-disable-line @typescript-eslint/no-non-null-assertion
      console.log('data', data);
      // TODO(jtomasek): update cluster in redux
    } catch (e) {
      formikActions.setStatus({ error: 'Failed to update the cluster.' });
      console.error(e);
      console.error('Response data:', e.response?.data);
    }
  };

  return (
    <Formik
      initialValues={initialValues}
      initialStatus={{ error: null }}
      validate={validate}
      onSubmit={handleSubmit}
    >
      {({
        handleSubmit,
        setStatus,
        isSubmitting,
        isValid,
        submitForm,
        status,
      }: FormikProps<ClusterUpdateParams>) => (
        <>
          <PageSection variant={PageSectionVariants.light} isMain>
            <Form onSubmit={handleSubmit}>
              <Grid gutter="md">
                <GridItem span={12} lg={10} xl={6}>
                  {/* TODO(jtomasek): remove this if we're not putting full width content here (e.g. hosts table)*/}
                  <GridGap>
                    <TextContent>
                      <Text component="h1">Configure a bare metal OpenShift cluster</Text>
                    </TextContent>
                    <InputField label="Cluster name" name="name" isRequired />
                    <SelectField
                      label="OpenShift Version"
                      name="openshiftVersion"
                      options={[
                        { label: 'OpenShift 4.4', value: '4.4' },
                        { label: 'OpenShift 4.5', value: '4.5' },
                        { label: 'OpenShift 4.6', value: '4.6' },
                      ]}
                      isRequired
                    />
                    <InputField
                      label="Base DNS domain"
                      name="baseDnsDomain"
                      helperText="The base domain of the cluster. All DNS records must be sub-domains of this base and include the cluster name."
                      isRequired
                    />
                    <TextContent>
                      <Text component="h2">Networking</Text>
                    </TextContent>
                    <InputField
                      name="clusterNetworkCIDR"
                      label="Cluster Network CIDR"
                      helperText="IP address block from which Pod IPs are allocated This block must not overlap with existing physical networks. These IP addresses are used for the Pod network, and if you need to access the Pods from an external network, configure load balancers and routers to manage the traffic."
                      isRequired
                    />
                    <InputField
                      name="clusterNetworkHostPrefix"
                      label="Cluster Network Host Prefix"
                      type={TextInputTypes.number}
                      helperText="The subnet prefix length to assign to each individual node. For example, if Cluster Network Host Prefix is set to 23, then each node is assigned a /23 subnet out of the given cidr (clusterNetworkCIDR), which allows for 510 (2^(32 - 23) - 2) pod IPs addresses. If you are required to provide access to nodes from an external network, configure load balancers and routers to manage the traffic."
                      isRequired
                    />
                    <InputField
                      name="serviceNetworkCIDR"
                      label="Service Network CIDR"
                      helperText="The IP address pool to use for service IP addresses. You can enter only one IP address pool. If you need to access the services from an external network, configure load balancers and routers to manage the traffic."
                      isRequired
                    />
                    <InputField
                      label="API Virtual IP"
                      name="apiVip"
                      helperText="Virtual IP used to reach the OpenShift cluster API."
                      isRequired
                    />
                    <InputField
                      name="dnsVip"
                      label="Internal DNS Virtual IP"
                      helperText="Virtual IP used internally by the cluster for automating internal DNS requirements."
                      isRequired
                    />
                    <InputField
                      name="ingressVip"
                      label="Ingress Virtual IP"
                      helperText="Virtual IP used for cluster ingress traffic."
                      isRequired
                    />
                    <TextContent>
                      <Text component="h2">Security</Text>
                    </TextContent>
                    <TextAreaField
                      name="pullSecret"
                      label="Pull Secret"
                      helperText={
                        <>
                          The pull secret obtained from the Pull Secret page on the{' '}
                          {
                            <a
                              href="https://cloud.redhat.com/openshift/install/metal/user-provisioned"
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Red Hat OpenShift Cluster Manager site <ExternalLinkAltIcon />
                            </a>
                          }
                          .
                        </>
                      }
                      isRequired
                    />
                    <TextAreaField
                      name="sshPublicKey"
                      label="SSH Public Key"
                      helperText="SSH public key for debugging OpenShift nodes."
                      isRequired
                    />
                  </GridGap>
                </GridItem>
              </Grid>
            </Form>
          </PageSection>
          <AlertsSection>
            {status.error && (
              <Alert
                variant={AlertVariant.danger}
                title={status.error}
                action={<AlertActionCloseButton onClose={() => setStatus({ error: null })} />}
              />
            )}
          </AlertsSection>
          <ClusterWizardToolbar>
            <ToolbarButton
              variant={ButtonVariant.secondary}
              component={(props) => <Link to="/clusters" {...props} />}
            >
              Cancel
            </ToolbarButton>
            <ToolbarButton
              variant={ButtonVariant.secondary}
              onClick={() => setStep(WizardStep.BaremetalInventory)}
            >
              Back
            </ToolbarButton>
            <ToolbarButton
              type="submit"
              variant={ButtonVariant.secondary}
              isDisabled={isSubmitting || !isValid}
              onClick={submitForm}
            >
              Save Configuration
            </ToolbarButton>
            <ToolbarButton variant={ButtonVariant.primary} isDisabled>
              Deploy cluster
            </ToolbarButton>
            {isSubmitting && <ToolbarText>Saving...</ToolbarText>}
          </ClusterWizardToolbar>
        </>
      )}
    </Formik>
  );
};

export default ClusterWizardForm;
